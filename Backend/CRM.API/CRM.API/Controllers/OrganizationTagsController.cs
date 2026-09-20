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
    [Route("api/OrganizationTags")]
    [Authorize(Roles = "Admin")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class OrganizationTagsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;

        public OrganizationTagsController(
            ApplicationDbContext context,
            ActivityLogger activityLogger)
        {
            _context = context;
            _activityLogger = activityLogger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrganizationTagResponse>>> GetTags()
        {
            var tags = await _context.OrganizationTags
                .AsNoTracking()
                .Where(t => t.Scope == "Organization")
                .OrderBy(t => t.Name)
                .Select(t => new OrganizationTagResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    Color = t.Color
                })
                .ToListAsync();

            return Ok(tags);
        }

        [HttpPost]
        public async Task<ActionResult<OrganizationTagResponse>> CreateTag(CreateOrganizationTagRequest request)
        {
            var name = request.Name.Trim();
            var exists = await _context.OrganizationTags
                .AsNoTracking()
                .AnyAsync(t => t.Scope == "Organization" && t.Name == name);

            if (exists)
            {
                return Conflict(new { message = "An organization tag with this name already exists." });
            }

            var tag = new OrganizationTag
            {
                Name = name,
                Color = string.IsNullOrWhiteSpace(request.Color) ? null : request.Color.Trim(),
                Scope = "Organization",
                CreatedAt = DateTime.UtcNow
            };

            _context.OrganizationTags.Add(tag);
            await _context.SaveChangesAsync();

            return Ok(new OrganizationTagResponse
            {
                Id = tag.Id,
                Name = tag.Name,
                Color = tag.Color
            });
        }

        [HttpGet("organization/{organizationId:int}")]
        public async Task<ActionResult<IEnumerable<OrganizationTagResponse>>> GetOrganizationTags(int organizationId)
        {
            var tags = await _context.OrganizationTagAssignments
                .AsNoTracking()
                .Where(a => a.OrganizationId == organizationId)
                .OrderBy(a => a.Tag.Name)
                .Select(a => new OrganizationTagResponse
                {
                    Id = a.Tag.Id,
                    Name = a.Tag.Name,
                    Color = a.Tag.Color
                })
                .ToListAsync();

            return Ok(tags);
        }

        [HttpPost("organization/{organizationId:int}/tag/{tagId:int}")]
        public async Task<IActionResult> AssignTag(int organizationId, int tagId)
        {
            var organization = await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == organizationId);

            if (organization == null)
            {
                return NotFound(new { message = "Organization not found." });
            }

            var tag = await _context.OrganizationTags
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == tagId && t.Scope == "Organization");

            if (tag == null)
            {
                return NotFound(new { message = "Tag not found." });
            }

            var exists = await _context.OrganizationTagAssignments
                .AnyAsync(a => a.OrganizationId == organizationId && a.TagId == tagId);

            if (exists)
            {
                return Conflict(new { message = "Tag is already assigned to this organization." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            _context.OrganizationTagAssignments.Add(new OrganizationTagAssignment
            {
                OrganizationId = organizationId,
                TagId = tagId,
                AssignedAt = DateTime.UtcNow
            });

            _activityLogger.Add(
                userId.Value,
                "Organization",
                organizationId,
                "Tag added",
                $"Added tag {tag.Name}.");

            await _context.SaveChangesAsync();

            return Ok(new { message = "Tag assigned successfully." });
        }

        [HttpDelete("organization/{organizationId:int}/tag/{tagId:int}")]
        public async Task<IActionResult> RemoveTag(int organizationId, int tagId)
        {
            var assignment = await _context.OrganizationTagAssignments
                .Include(a => a.Tag)
                .FirstOrDefaultAsync(a => a.OrganizationId == organizationId && a.TagId == tagId);

            if (assignment == null)
            {
                return NotFound(new { message = "Organization tag assignment not found." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var tagName = assignment.Tag.Name;
            _context.OrganizationTagAssignments.Remove(assignment);

            _activityLogger.Add(
                userId.Value,
                "Organization",
                organizationId,
                "Tag removed",
                $"Removed tag {tagName}.");

            await _context.SaveChangesAsync();

            return Ok(new { message = "Tag removed successfully." });
        }
    }
}
