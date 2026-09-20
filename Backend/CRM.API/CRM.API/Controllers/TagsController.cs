using CRM.API.Data;
using CRM.API.DTOs.Tag;
using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TagsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AccessControlService _access;

        public TagsController(
            ApplicationDbContext context,
            AccessControlService access)
        {
            _context = context;
            _access = access;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<TagResponse>>> GetTags()
        {
            var tags = await _context.Tags
                .AsNoTracking()
                .OrderBy(t => t.Name)
                .Select(t => new TagResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    Color = t.Color
                })
                .ToListAsync();

            return Ok(tags);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TagResponse>> CreateTag(
            CreateTagRequest request)
        {
            var name = request.Name.Trim();
            var exists = await _context.Tags
                .AnyAsync(t => t.Name.ToLower() == name.ToLower());

            if (exists)
            {
                return Conflict(new { message = "Tag already exists." });
            }

            var tag = new Tag
            {
                Name = name,
                Color = request.Color?.Trim()
            };

            _context.Tags.Add(tag);
            await _context.SaveChangesAsync();

            return Ok(new TagResponse
            {
                Id = tag.Id,
                Name = tag.Name,
                Color = tag.Color
            });
        }

        [HttpPost("assign")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignTag(AssignTagRequest request)
        {
            var taskExists = await _context.TaskItems
                .AnyAsync(t => t.Id == request.TaskItemId);
            if (!taskExists)
            {
                return NotFound(new { message = "Task not found." });
            }

            var tagExists = await _context.Tags
                .AnyAsync(t => t.Id == request.TagId);
            if (!tagExists)
            {
                return NotFound(new { message = "Tag not found." });
            }

            var exists = await _context.TaskTags
                .AnyAsync(tt =>
                    tt.TaskItemId == request.TaskItemId &&
                    tt.TagId == request.TagId);

            if (exists)
            {
                return Conflict(new
                {
                    message = "Tag is already assigned to this task."
                });
            }

            _context.TaskTags.Add(new TaskTag
            {
                TaskItemId = request.TaskItemId,
                TagId = request.TagId
            });

            await _context.SaveChangesAsync();
            return Ok(new { message = "Tag assigned successfully." });
        }

        [HttpGet("task/{taskId:int}")]
        public async Task<ActionResult<IEnumerable<TagResponse>>> GetTaskTags(
            int taskId)
        {
            var taskExists = await _context.TaskItems.AnyAsync(t => t.Id == taskId);
            if (!taskExists)
            {
                return NotFound(new { message = "Task not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, taskId))
            {
                return Forbid();
            }

            var tags = await _context.TaskTags
                .AsNoTracking()
                .Where(tt => tt.TaskItemId == taskId)
                .Select(tt => new TagResponse
                {
                    Id = tt.Tag.Id,
                    Name = tt.Tag.Name,
                    Color = tt.Tag.Color
                })
                .ToListAsync();

            return Ok(tags);
        }

        [HttpDelete("task/{taskId:int}/tag/{tagId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveTag(int taskId, int tagId)
        {
            var taskTag = await _context.TaskTags
                .FirstOrDefaultAsync(tt =>
                    tt.TaskItemId == taskId &&
                    tt.TagId == tagId);

            if (taskTag == null)
            {
                return NotFound(new
                {
                    message = "Task tag assignment not found."
                });
            }

            _context.TaskTags.Remove(taskTag);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tag removed successfully." });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTag(int id)
        {
            var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == id);
            if (tag == null)
            {
                return NotFound(new { message = "Tag not found." });
            }

            _context.Tags.Remove(tag);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Tag deleted successfully." });
        }
    }
}
