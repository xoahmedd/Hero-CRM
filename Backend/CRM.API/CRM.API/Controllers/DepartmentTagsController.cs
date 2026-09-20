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
    [Route("api/DepartmentTags")]
    [Authorize(Roles = "Admin")]
    public class DepartmentTagsController : ControllerBase
    {
        private const string DepartmentType = "Department";
        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;

        public DepartmentTagsController(ApplicationDbContext context, ActivityLogger activityLogger)
        {
            _context = context;
            _activityLogger = activityLogger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentTagResponse>>> GetTags()
        {
            var tags = await _context.OrganizationTags
                .AsNoTracking()
                .Where(t => t.Scope == "Department")
                .OrderBy(t => t.Name)
                .Select(t => new DepartmentTagResponse { Id = t.Id, Name = t.Name, Color = t.Color })
                .ToListAsync();

            return Ok(tags);
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentTagResponse>> CreateTag(CreateDepartmentTagRequest request)
        {
            var name = request.Name.Trim();
            var exists = await _context.OrganizationTags.AsNoTracking().AnyAsync(t => t.Scope == "Department" && t.Name == name);
            if (exists)
            {
                return Conflict(new { message = "A tag with this name already exists." });
            }

            var tag = new OrganizationTag
            {
                Name = name,
                Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim(),
                Scope = "Department",
                CreatedAt = DateTime.UtcNow
            };

            _context.OrganizationTags.Add(tag);
            await _context.SaveChangesAsync();

            return Ok(new DepartmentTagResponse { Id = tag.Id, Name = tag.Name, Color = tag.Color });
        }

        [HttpGet("department/{departmentId:int}")]
        public async Task<ActionResult<IEnumerable<DepartmentTagResponse>>> GetDepartmentTags(int departmentId)
        {
            var tags = await _context.OrganizationTagAssignments
                .AsNoTracking()
                .Where(a => a.OrganizationId == departmentId && a.Organization.Type == DepartmentType)
                .OrderBy(a => a.Tag.Name)
                .Select(a => new DepartmentTagResponse { Id = a.Tag.Id, Name = a.Tag.Name, Color = a.Tag.Color })
                .ToListAsync();

            return Ok(tags);
        }

        [HttpPost("department/{departmentId:int}/tag/{tagId:int}")]
        public async Task<IActionResult> AssignTag(int departmentId, int tagId)
        {
            var department = await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == departmentId && d.Type == DepartmentType);
            if (department == null)
            {
                return NotFound(new { message = "Department not found." });
            }

            var tag = await _context.OrganizationTags.AsNoTracking().FirstOrDefaultAsync(t => t.Id == tagId && t.Scope == "Department");
            if (tag == null)
            {
                return NotFound(new { message = "Tag not found." });
            }

            var exists = await _context.OrganizationTagAssignments
                .AnyAsync(a => a.OrganizationId == departmentId && a.TagId == tagId);
            if (exists)
            {
                return Conflict(new { message = "Tag is already assigned to this department." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            _context.OrganizationTagAssignments.Add(new OrganizationTagAssignment
            {
                OrganizationId = departmentId,
                TagId = tagId,
                AssignedAt = DateTime.UtcNow
            });

            _activityLogger.Add(userId.Value, "Department", departmentId, "Tag added", $"Added tag {tag.Name}.");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tag assigned successfully." });
        }

        [HttpDelete("department/{departmentId:int}/tag/{tagId:int}")]
        public async Task<IActionResult> RemoveTag(int departmentId, int tagId)
        {
            var assignment = await _context.OrganizationTagAssignments
                .Include(a => a.Tag)
                .Include(a => a.Organization)
                .FirstOrDefaultAsync(a =>
                    a.OrganizationId == departmentId &&
                    a.TagId == tagId &&
                    a.Organization.Type == DepartmentType);

            if (assignment == null)
            {
                return NotFound(new { message = "Department tag assignment not found." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var tagName = assignment.Tag.Name;
            _context.OrganizationTagAssignments.Remove(assignment);
            _activityLogger.Add(userId.Value, "Department", departmentId, "Tag removed", $"Removed tag {tagName}.");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tag removed successfully." });
        }
    }
}
