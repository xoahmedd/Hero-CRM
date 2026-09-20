using CRM.API.Data;
using CRM.API.DTOs.Organization;
using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class OrganizationsController : ControllerBase
    {
        private static readonly string[] AllowedStatuses = ["Lead", "Active", "Inactive"];
        private static readonly string[] AllowedTypes = ["Distributor", "Wholesaler", "RetailChain", "Retailer", "ECommerce", "Other"];

        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;

        public OrganizationsController(
            ApplicationDbContext context,
            ActivityLogger activityLogger)
        {
            _context = context;
            _activityLogger = activityLogger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrganizationResponse>>> GetOrganizations()
        {
            var organizations = await BaseQuery()
                .OrderBy(o => o.Name)
                .Select(OrganizationProjection)
                .ToListAsync();

            return Ok(organizations);
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetOrganizationsPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] string? type = null,
            [FromQuery] string? region = null,
            [FromQuery] int? ownerId = null)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = BaseQuery();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(o =>
                    o.Name.Contains(term) ||
                    (o.Email != null && o.Email.Contains(term)) ||
                    (o.Phone != null && o.Phone.Contains(term)) ||
                    (o.Region != null && o.Region.Contains(term)) ||
                    o.Contacts.Any(c =>
                        c.Name.Contains(term) ||
                        (c.Email != null && c.Email.Contains(term))));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(o => o.Status == status.Trim());
            }

            if (!string.IsNullOrWhiteSpace(type))
            {
                query = query.Where(o => o.Type == type.Trim());
            }

            if (!string.IsNullOrWhiteSpace(region))
            {
                query = query.Where(o => o.Region == region.Trim());
            }

            if (ownerId.HasValue)
            {
                query = query.Where(o => o.OwnerId == ownerId.Value);
            }

            var totalItems = await query.CountAsync();
            var items = await query
                .OrderByDescending(o => o.UpdatedAt ?? o.CreatedAt)
                .ThenBy(o => o.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(OrganizationProjection)
                .ToListAsync();

            return Ok(new
            {
                items,
                page,
                pageSize,
                totalItems,
                totalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            });
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<OrganizationResponse>> GetOrganization(int id)
        {
            var organization = await BaseQuery()
                .Where(o => o.Id == id)
                .Select(OrganizationProjection)
                .FirstOrDefaultAsync();

            if (organization == null)
            {
                return NotFound(new { message = "Organization not found." });
            }

            return Ok(organization);
        }

        [HttpPost]
        public async Task<ActionResult<OrganizationResponse>> CreateOrganization(
            CreateOrganizationRequest request)
        {
            var validationError = await ValidateRequestAsync(request);
            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            var actorId = AccessControlService.GetUserId(User);
            if (actorId == null)
            {
                return Unauthorized();
            }

            var organization = new Customer
            {
                Name = request.Name.Trim(),
                Email = NormalizeEmail(request.Email),
                Phone = Normalize(request.Phone),
                Address = Normalize(request.Address),
                Website = Normalize(request.Website),
                Status = request.Status.Trim(),
                Type = request.Type.Trim(),
                Region = Normalize(request.Region),
                OwnerId = request.OwnerId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(organization);
            await _context.SaveChangesAsync();

            _activityLogger.Add(
                actorId.Value,
                "Organization",
                organization.Id,
                "Organization created",
                $"Created {organization.Name} as {organization.Type}.");

            await _context.SaveChangesAsync();

            var response = await BaseQuery()
                .Where(o => o.Id == organization.Id)
                .Select(OrganizationProjection)
                .FirstAsync();

            return CreatedAtAction(nameof(GetOrganization), new { id = organization.Id }, response);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateOrganization(
            int id,
            UpdateOrganizationRequest request)
        {
            var validationError = await ValidateRequestAsync(request);
            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            var organization = await _context.Customers.FirstOrDefaultAsync(o => o.Id == id);
            if (organization == null)
            {
                return NotFound(new { message = "Organization not found." });
            }

            var actorId = AccessControlService.GetUserId(User);
            if (actorId == null)
            {
                return Unauthorized();
            }

            organization.Name = request.Name.Trim();
            organization.Email = NormalizeEmail(request.Email);
            organization.Phone = Normalize(request.Phone);
            organization.Address = Normalize(request.Address);
            organization.Website = Normalize(request.Website);
            organization.Status = request.Status.Trim();
            organization.Type = request.Type.Trim();
            organization.Region = Normalize(request.Region);
            organization.OwnerId = request.OwnerId;
            organization.UpdatedAt = DateTime.UtcNow;

            _activityLogger.Add(
                actorId.Value,
                "Organization",
                organization.Id,
                "Organization updated",
                $"Updated CRM details for {organization.Name}.");

            await _context.SaveChangesAsync();

            return Ok(new { message = "Organization updated successfully." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteOrganization(int id)
        {
            var organization = await _context.Customers.FirstOrDefaultAsync(o => o.Id == id);
            if (organization == null)
            {
                return NotFound(new { message = "Organization not found." });
            }

            _context.Customers.Remove(organization);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Organization deleted successfully." });
        }

        [HttpGet("regions")]
        public async Task<ActionResult<IEnumerable<string>>> GetRegions()
        {
            var regions = await _context.Customers
                .AsNoTracking()
                .Where(o => o.Region != null && o.Region != "")
                .Select(o => o.Region!)
                .Distinct()
                .OrderBy(r => r)
                .ToListAsync();

            return Ok(regions);
        }

        private IQueryable<Customer> BaseQuery()
        {
            return _context.Customers.AsNoTracking();
        }

        private async Task<string?> ValidateRequestAsync(CreateOrganizationRequest request)
        {
            if (!AllowedStatuses.Contains(request.Status.Trim(), StringComparer.OrdinalIgnoreCase))
            {
                return $"Status must be one of: {string.Join(", ", AllowedStatuses)}.";
            }

            if (!AllowedTypes.Contains(request.Type.Trim(), StringComparer.OrdinalIgnoreCase))
            {
                return $"Type must be one of: {string.Join(", ", AllowedTypes)}.";
            }

            if (request.OwnerId.HasValue)
            {
                var ownerExists = await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Id == request.OwnerId.Value && u.IsActive);

                if (!ownerExists)
                {
                    return "Selected organization owner was not found or is inactive.";
                }
            }

            return null;
        }

        private static readonly Expression<Func<Customer, OrganizationResponse>> OrganizationProjection =
            o => new OrganizationResponse
            {
                Id = o.Id,
                Name = o.Name,
                Email = o.Email,
                Phone = o.Phone,
                Address = o.Address,
                Website = o.Website,
                LegacyNotes = o.Notes,
                Status = o.Status,
                Type = o.Type,
                Region = o.Region,
                OwnerId = o.OwnerId,
                OwnerName = o.Owner != null ? o.Owner.FullName : null,
                ContactCount = o.Contacts.Count,
                ProjectCount = o.Projects.Count,
                CreatedAt = o.CreatedAt,
                UpdatedAt = o.UpdatedAt
            };

        private static string? Normalize(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string? NormalizeEmail(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
    }
}
