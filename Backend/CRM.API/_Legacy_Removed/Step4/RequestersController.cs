using CRM.API.Data;
using CRM.API.DTOs.Department;
using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [ApiExplorerSettings(IgnoreApi = true)]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Manager")]
    public class RequestersController : ControllerBase
    {
        private const string DepartmentType = "Department";
        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;

        public RequestersController(ApplicationDbContext context, ActivityLogger activityLogger)
        {
            _context = context;
            _activityLogger = activityLogger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<RequesterResponse>>> GetRequesters(
            [FromQuery] int? departmentId = null,
            [FromQuery] string? search = null)
        {
            var query = _context.Contacts
                .AsNoTracking()
                .Include(r => r.Organization)
                .Where(r => r.Organization.Type == DepartmentType);

            if (departmentId.HasValue)
            {
                query = query.Where(r => r.OrganizationId == departmentId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(r =>
                    r.Name.Contains(term) ||
                    (r.JobTitle != null && r.JobTitle.Contains(term)) ||
                    (r.Email != null && r.Email.Contains(term)) ||
                    (r.Phone != null && r.Phone.Contains(term)) ||
                    r.Organization.Name.Contains(term));
            }

            var requesters = await query
                .OrderByDescending(r => r.IsPrimary)
                .ThenBy(r => r.Name)
                .Select(r => new RequesterResponse
                {
                    Id = r.Id,
                    DepartmentId = r.OrganizationId,
                    DepartmentName = r.Organization.Name,
                    Name = r.Name,
                    JobTitle = r.JobTitle,
                    Email = r.Email,
                    Phone = r.Phone,
                    IsPrimary = r.IsPrimary,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .ToListAsync();

            return Ok(requesters);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<RequesterResponse>> GetRequester(int id)
        {
            var requester = await _context.Contacts
                .AsNoTracking()
                .Where(r => r.Id == id && r.Organization.Type == DepartmentType)
                .Select(r => new RequesterResponse
                {
                    Id = r.Id,
                    DepartmentId = r.OrganizationId,
                    DepartmentName = r.Organization.Name,
                    Name = r.Name,
                    JobTitle = r.JobTitle,
                    Email = r.Email,
                    Phone = r.Phone,
                    IsPrimary = r.IsPrimary,
                    CreatedAt = r.CreatedAt,
                    UpdatedAt = r.UpdatedAt
                })
                .FirstOrDefaultAsync();

            return requester == null
                ? NotFound(new { message = "Requester not found." })
                : Ok(requester);
        }

        [HttpPost]
        public async Task<ActionResult<RequesterResponse>> CreateRequester(CreateRequesterRequest request)
        {
            var department = await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == request.DepartmentId && d.Type == DepartmentType);

            if (department == null)
            {
                return BadRequest(new { message = "Selected department was not found." });
            }

            var actorId = AccessControlService.GetUserId(User);
            if (actorId == null)
            {
                return Unauthorized();
            }

            if (request.IsPrimary)
            {
                await ClearPrimaryRequesterAsync(request.DepartmentId);
            }

            var requester = new Contact
            {
                OrganizationId = request.DepartmentId,
                Name = request.Name.Trim(),
                JobTitle = Normalize(request.JobTitle),
                Email = NormalizeEmail(request.Email),
                Phone = Normalize(request.Phone),
                IsPrimary = request.IsPrimary,
                CreatedAt = DateTime.UtcNow
            };

            _context.Contacts.Add(requester);
            await _context.SaveChangesAsync();

            _activityLogger.Add(
                actorId.Value,
                "Department",
                request.DepartmentId,
                "Requester added",
                $"Added {requester.Name}{FormatJobTitle(requester.JobTitle)} as a department requester.");

            await _context.SaveChangesAsync();

            return Ok(new RequesterResponse
            {
                Id = requester.Id,
                DepartmentId = requester.OrganizationId,
                DepartmentName = department.Name,
                Name = requester.Name,
                JobTitle = requester.JobTitle,
                Email = requester.Email,
                Phone = requester.Phone,
                IsPrimary = requester.IsPrimary,
                CreatedAt = requester.CreatedAt,
                UpdatedAt = requester.UpdatedAt
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateRequester(int id, UpdateRequesterRequest request)
        {
            var requester = await _context.Contacts
                .Include(r => r.Organization)
                .FirstOrDefaultAsync(r => r.Id == id && r.Organization.Type == DepartmentType);

            if (requester == null)
            {
                return NotFound(new { message = "Requester not found." });
            }

            var actorId = AccessControlService.GetUserId(User);
            if (actorId == null)
            {
                return Unauthorized();
            }

            if (request.IsPrimary)
            {
                await ClearPrimaryRequesterAsync(requester.OrganizationId, requester.Id);
            }

            requester.Name = request.Name.Trim();
            requester.JobTitle = Normalize(request.JobTitle);
            requester.Email = NormalizeEmail(request.Email);
            requester.Phone = Normalize(request.Phone);
            requester.IsPrimary = request.IsPrimary;
            requester.UpdatedAt = DateTime.UtcNow;

            _activityLogger.Add(
                actorId.Value,
                "Department",
                requester.OrganizationId,
                "Requester updated",
                $"Updated requester {requester.Name}.");

            await _context.SaveChangesAsync();
            return Ok(new { message = "Requester updated successfully." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteRequester(int id)
        {
            var requester = await _context.Contacts
                .Include(r => r.Organization)
                .FirstOrDefaultAsync(r => r.Id == id && r.Organization.Type == DepartmentType);

            if (requester == null)
            {
                return NotFound(new { message = "Requester not found." });
            }

            var actorId = AccessControlService.GetUserId(User);
            if (actorId == null)
            {
                return Unauthorized();
            }

            var departmentId = requester.OrganizationId;
            var name = requester.Name;
            _context.Contacts.Remove(requester);

            _activityLogger.Add(
                actorId.Value,
                "Department",
                departmentId,
                "Requester removed",
                $"Removed requester {name}.");

            await _context.SaveChangesAsync();
            return Ok(new { message = "Requester deleted successfully." });
        }

        private async Task ClearPrimaryRequesterAsync(int departmentId, int? exceptId = null)
        {
            var currentPrimary = await _context.Contacts
                .Where(r =>
                    r.OrganizationId == departmentId &&
                    r.IsPrimary &&
                    (!exceptId.HasValue || r.Id != exceptId.Value))
                .ToListAsync();

            foreach (var requester in currentPrimary)
            {
                requester.IsPrimary = false;
                requester.UpdatedAt = DateTime.UtcNow;
            }
        }

        private static string? Normalize(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string? NormalizeEmail(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();

        private static string FormatJobTitle(string? value) =>
            string.IsNullOrWhiteSpace(value) ? string.Empty : $" ({value})";
    }
}
