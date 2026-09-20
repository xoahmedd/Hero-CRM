using CRM.API.Data;
using CRM.API.DTOs.Organization;
using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class ContactsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;

        public ContactsController(
            ApplicationDbContext context,
            ActivityLogger activityLogger)
        {
            _context = context;
            _activityLogger = activityLogger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ContactResponse>>> GetContacts(
            [FromQuery] int? organizationId = null,
            [FromQuery] string? search = null)
        {
            var query = _context.Contacts
                .AsNoTracking()
                .Include(c => c.Organization)
                .AsQueryable();

            if (organizationId.HasValue)
            {
                query = query.Where(c => c.OrganizationId == organizationId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(c =>
                    c.Name.Contains(term) ||
                    (c.Email != null && c.Email.Contains(term)) ||
                    (c.Phone != null && c.Phone.Contains(term)) ||
                    (c.JobTitle != null && c.JobTitle.Contains(term)) ||
                    c.Organization.Name.Contains(term));
            }

            var contacts = await query
                .OrderByDescending(c => c.IsPrimary)
                .ThenBy(c => c.Name)
                .ToListAsync();

            return Ok(contacts.Select(ToResponse));
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ContactResponse>> GetContact(int id)
        {
            var contact = await _context.Contacts
                .AsNoTracking()
                .Include(c => c.Organization)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (contact == null)
            {
                return NotFound(new { message = "Contact not found." });
            }

            return Ok(ToResponse(contact));
        }

        [HttpPost]
        public async Task<ActionResult<ContactResponse>> CreateContact(CreateContactRequest request)
        {
            var organization = await _context.Customers
                .FirstOrDefaultAsync(o => o.Id == request.OrganizationId);

            if (organization == null)
            {
                return BadRequest(new { message = "Organization not found." });
            }

            var actorId = AccessControlService.GetUserId(User);
            if (actorId == null)
            {
                return Unauthorized();
            }

            if (request.IsPrimary)
            {
                await ClearPrimaryContactAsync(request.OrganizationId);
            }

            var contact = new Contact
            {
                OrganizationId = request.OrganizationId,
                Name = request.Name.Trim(),
                JobTitle = Normalize(request.JobTitle),
                Email = NormalizeEmail(request.Email),
                Phone = Normalize(request.Phone),
                IsPrimary = request.IsPrimary,
                CreatedAt = DateTime.UtcNow
            };

            _context.Contacts.Add(contact);
            await _context.SaveChangesAsync();

            _activityLogger.Add(
                actorId.Value,
                "Organization",
                organization.Id,
                "Contact added",
                $"Added {contact.Name}{FormatJobTitle(contact.JobTitle)}.");

            await _context.SaveChangesAsync();

            var response = new ContactResponse
            {
                Id = contact.Id,
                OrganizationId = organization.Id,
                OrganizationName = organization.Name,
                Name = contact.Name,
                JobTitle = contact.JobTitle,
                Email = contact.Email,
                Phone = contact.Phone,
                IsPrimary = contact.IsPrimary,
                CreatedAt = contact.CreatedAt,
                UpdatedAt = contact.UpdatedAt
            };

            return CreatedAtAction(nameof(GetContact), new { id = contact.Id }, response);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateContact(int id, UpdateContactRequest request)
        {
            var contact = await _context.Contacts
                .Include(c => c.Organization)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (contact == null)
            {
                return NotFound(new { message = "Contact not found." });
            }

            var actorId = AccessControlService.GetUserId(User);
            if (actorId == null)
            {
                return Unauthorized();
            }

            if (request.IsPrimary && !contact.IsPrimary)
            {
                await ClearPrimaryContactAsync(contact.OrganizationId, contact.Id);
            }

            contact.Name = request.Name.Trim();
            contact.JobTitle = Normalize(request.JobTitle);
            contact.Email = NormalizeEmail(request.Email);
            contact.Phone = Normalize(request.Phone);
            contact.IsPrimary = request.IsPrimary;
            contact.UpdatedAt = DateTime.UtcNow;

            _activityLogger.Add(
                actorId.Value,
                "Organization",
                contact.OrganizationId,
                "Contact updated",
                $"Updated {contact.Name}{FormatJobTitle(contact.JobTitle)}.");

            await _context.SaveChangesAsync();

            return Ok(new { message = "Contact updated successfully." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteContact(int id)
        {
            var contact = await _context.Contacts
                .Include(c => c.Organization)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (contact == null)
            {
                return NotFound(new { message = "Contact not found." });
            }

            var actorId = AccessControlService.GetUserId(User);
            if (actorId == null)
            {
                return Unauthorized();
            }

            var organizationId = contact.OrganizationId;
            var name = contact.Name;

            _context.Contacts.Remove(contact);
            _activityLogger.Add(
                actorId.Value,
                "Organization",
                organizationId,
                "Contact removed",
                $"Removed {name} from the organization.");

            await _context.SaveChangesAsync();

            return Ok(new { message = "Contact deleted successfully." });
        }

        private async Task ClearPrimaryContactAsync(int organizationId, int? exceptId = null)
        {
            var currentPrimary = await _context.Contacts
                .Where(c =>
                    c.OrganizationId == organizationId &&
                    c.IsPrimary &&
                    (!exceptId.HasValue || c.Id != exceptId.Value))
                .ToListAsync();

            foreach (var contact in currentPrimary)
            {
                contact.IsPrimary = false;
                contact.UpdatedAt = DateTime.UtcNow;
            }
        }

        private static ContactResponse ToResponse(Contact c)
        {
            return new ContactResponse
            {
                Id = c.Id,
                OrganizationId = c.OrganizationId,
                OrganizationName = c.Organization.Name,
                Name = c.Name,
                JobTitle = c.JobTitle,
                Email = c.Email,
                Phone = c.Phone,
                IsPrimary = c.IsPrimary,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            };
        }

        private static string? Normalize(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string? NormalizeEmail(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();

        private static string FormatJobTitle(string? value) =>
            string.IsNullOrWhiteSpace(value) ? string.Empty : $" ({value})";
    }
}
