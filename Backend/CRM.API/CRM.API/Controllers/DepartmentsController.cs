using CRM.API.Data;
using CRM.API.DTOs.Department;
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
    public class DepartmentsController : ControllerBase
    {
        private const string DepartmentType = "Department";
        private static readonly string[] AllowedStatuses = ["Active", "Inactive"];

        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;

        public DepartmentsController(ApplicationDbContext context, ActivityLogger activityLogger)
        {
            _context = context;
            _activityLogger = activityLogger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentResponse>>> GetDepartments()
        {
            var departments = await BaseQuery()
                .OrderBy(d => d.Name)
                .Select(DepartmentProjection)
                .ToListAsync();

            return Ok(departments);
        }

        [HttpGet("paged")]
        public async Task<IActionResult> GetDepartmentsPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            [FromQuery] int? ownerId = null)
        {
            page = Math.Max(page, 1);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = BaseQuery();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(d =>
                    d.Name.Contains(term) ||
                    (d.Email != null && d.Email.Contains(term)) ||
                    (d.Phone != null && d.Phone.Contains(term)) ||
                    d.Contacts.Any(r =>
                        r.Name.Contains(term) ||
                        (r.Email != null && r.Email.Contains(term))));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(d => d.Status == status.Trim());
            }

            if (ownerId.HasValue)
            {
                query = query.Where(d => d.OwnerId == ownerId.Value);
            }

            var totalItems = await query.CountAsync();
            var items = await query
                .OrderByDescending(d => d.UpdatedAt ?? d.CreatedAt)
                .ThenBy(d => d.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(DepartmentProjection)
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
        public async Task<ActionResult<DepartmentResponse>> GetDepartment(int id)
        {
            var department = await BaseQuery()
                .Where(d => d.Id == id)
                .Select(DepartmentProjection)
                .FirstOrDefaultAsync();

            if (department == null)
            {
                return NotFound(new { message = "Department not found." });
            }

            return Ok(department);
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentResponse>> CreateDepartment(CreateDepartmentRequest request)
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

            var department = new Customer
            {
                Name = request.Name.Trim(),
                Email = NormalizeEmail(request.Email),
                Phone = Normalize(request.Phone),
                Address = Normalize(request.Address),
                Website = Normalize(request.Website),
                Status = request.Status.Trim(),
                Type = DepartmentType,
                Region = null,
                OwnerId = request.OwnerId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Customers.Add(department);
            await _context.SaveChangesAsync();

            _activityLogger.Add(
                actorId.Value,
                "Department",
                department.Id,
                "Department created",
                $"Created IT department record for {department.Name}.");

            await _context.SaveChangesAsync();

            var response = await BaseQuery()
                .Where(d => d.Id == department.Id)
                .Select(DepartmentProjection)
                .FirstAsync();

            return CreatedAtAction(nameof(GetDepartment), new { id = department.Id }, response);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateDepartment(int id, UpdateDepartmentRequest request)
        {
            var validationError = await ValidateRequestAsync(request);
            if (validationError != null)
            {
                return BadRequest(new { message = validationError });
            }

            var department = await _context.Customers
                .FirstOrDefaultAsync(d => d.Id == id && d.Type == DepartmentType);

            if (department == null)
            {
                return NotFound(new { message = "Department not found." });
            }

            var actorId = AccessControlService.GetUserId(User);
            if (actorId == null)
            {
                return Unauthorized();
            }

            department.Name = request.Name.Trim();
            department.Email = NormalizeEmail(request.Email);
            department.Phone = Normalize(request.Phone);
            department.Address = Normalize(request.Address);
            department.Website = Normalize(request.Website);
            department.Status = request.Status.Trim();
            department.OwnerId = request.OwnerId;
            department.UpdatedAt = DateTime.UtcNow;

            _activityLogger.Add(
                actorId.Value,
                "Department",
                department.Id,
                "Department updated",
                $"Updated IT department details for {department.Name}.");

            await _context.SaveChangesAsync();

            return Ok(new { message = "Department updated successfully." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteDepartment(int id)
        {
            var department = await _context.Customers
                .FirstOrDefaultAsync(d => d.Id == id && d.Type == DepartmentType);

            if (department == null)
            {
                return NotFound(new { message = "Department not found." });
            }

            // FollowUps.DepartmentId uses NO ACTION to avoid SQL Server multiple
            // cascade paths. Clear the optional CRM reference before deleting the
            // department so existing follow-up history is preserved.
            var linkedFollowUps = await _context.FollowUps
                .Where(f => f.DepartmentId == id)
                .ToListAsync();

            var now = DateTime.UtcNow;
            foreach (var followUp in linkedFollowUps)
            {
                followUp.DepartmentId = null;
                followUp.UpdatedAt = now;
            }

            _context.Customers.Remove(department);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Department deleted successfully." });
        }

        private IQueryable<Customer> BaseQuery() =>
            _context.Customers.AsNoTracking().Where(d => d.Type == DepartmentType);

        private async Task<string?> ValidateRequestAsync(CreateDepartmentRequest request)
        {
            if (!AllowedStatuses.Contains(request.Status.Trim(), StringComparer.OrdinalIgnoreCase))
            {
                return $"Status must be one of: {string.Join(", ", AllowedStatuses)}.";
            }

            if (request.OwnerId.HasValue)
            {
                var ownerExists = await _context.Users
                    .AsNoTracking()
                    .AnyAsync(u => u.Id == request.OwnerId.Value && u.IsActive);

                if (!ownerExists)
                {
                    return "Selected IT owner was not found or is inactive.";
                }
            }

            return null;
        }

        private static readonly Expression<Func<Customer, DepartmentResponse>> DepartmentProjection =
            d => new DepartmentResponse
            {
                Id = d.Id,
                Name = d.Name,
                Email = d.Email,
                Phone = d.Phone,
                Address = d.Address,
                Website = d.Website,
                Status = d.Status,
                OwnerId = d.OwnerId,
                OwnerName = d.Owner != null ? d.Owner.FullName : null,
                PeopleCount = d.Contacts.Count,
                ProjectCount = d.Projects.Count,
                CreatedAt = d.CreatedAt,
                UpdatedAt = d.UpdatedAt
            };

        private static string? Normalize(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string? NormalizeEmail(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
    }
}
