using CRM.API.Data;
using CRM.API.DTOs.Comment;
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
    public class CommentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AccessControlService _access;

        public CommentsController(
            ApplicationDbContext context,
            AccessControlService access)
        {
            _context = context;
            _access = access;
        }

        [HttpGet("task/{taskId:int}")]
        public async Task<ActionResult<IEnumerable<CommentResponse>>> GetTaskComments(
            int taskId)
        {
            var taskExists = await _context.TaskItems
                .AnyAsync(t => t.Id == taskId);

            if (!taskExists)
            {
                return NotFound(new { message = "Task not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, taskId))
            {
                return Forbid();
            }

            var comments = await _context.Comments
                .AsNoTracking()
                .Where(c => c.TaskItemId == taskId)
                .OrderBy(c => c.CreatedAt)
                .Select(c => new CommentResponse
                {
                    Id = c.Id,
                    TaskItemId = c.TaskItemId,
                    TaskTitle = c.TaskItem.Title,
                    UserId = c.UserId,
                    UserName = c.User.FullName,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .ToListAsync();

            return Ok(comments);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CommentResponse>> GetComment(int id)
        {
            var comment = await _context.Comments
                .AsNoTracking()
                .Where(c => c.Id == id)
                .Select(c => new CommentResponse
                {
                    Id = c.Id,
                    TaskItemId = c.TaskItemId,
                    TaskTitle = c.TaskItem.Title,
                    UserId = c.UserId,
                    UserName = c.User.FullName,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    UpdatedAt = c.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (comment == null)
            {
                return NotFound(new { message = "Comment not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, comment.TaskItemId))
            {
                return Forbid();
            }

            return Ok(comment);
        }

        // Users may reply only on tasks assigned to them.
        // The author is always taken from the JWT, never from the request body.
        [HttpPost]
        [Authorize(Roles = "Admin,User")]
        public async Task<ActionResult<CommentResponse>> CreateComment(
            CreateCommentRequest request)
        {
            var task = await _context.TaskItems
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == request.TaskItemId);

            if (task == null)
            {
                return BadRequest(new
                {
                    message = "The specified task does not exist."
                });
            }

            if (!await _access.CanAccessTaskAsync(User, request.TaskItemId))
            {
                return Forbid();
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Authenticated user could not be determined."
                });
            }

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId.Value && u.IsActive);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Authenticated user is inactive or no longer exists."
                });
            }

            var comment = new Comment
            {
                TaskItemId = request.TaskItemId,
                UserId = userId.Value,
                Content = request.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetComment),
                new { id = comment.Id },
                new CommentResponse
                {
                    Id = comment.Id,
                    TaskItemId = comment.TaskItemId,
                    TaskTitle = task.Title,
                    UserId = comment.UserId,
                    UserName = user.FullName,
                    Content = comment.Content,
                    CreatedAt = comment.CreatedAt,
                    UpdatedAt = comment.UpdatedAt
                });
        }

        // Regular employees cannot edit messages after sending them.
        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateComment(
            int id,
            UpdateCommentRequest request)
        {
            var comment = await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null)
            {
                return NotFound(new { message = "Comment not found." });
            }

            comment.Content = request.Content.Trim();
            comment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Comment updated successfully." });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var comment = await _context.Comments
                .FirstOrDefaultAsync(c => c.Id == id);

            if (comment == null)
            {
                return NotFound(new { message = "Comment not found." });
            }

            _context.Comments.Remove(comment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Comment deleted successfully." });
        }
    }
}
