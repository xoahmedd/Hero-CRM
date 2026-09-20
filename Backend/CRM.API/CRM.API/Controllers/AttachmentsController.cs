using CRM.API.Data;
using CRM.API.DTOs.Attachment;
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
    public class AttachmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AccessControlService _access;

        public AttachmentsController(
            ApplicationDbContext context,
            AccessControlService access)
        {
            _context = context;
            _access = access;
        }

        [HttpGet("task/{taskId:int}")]
        public async Task<ActionResult<IEnumerable<AttachmentResponse>>> GetTaskAttachments(
            int taskId)
        {
            var exists = await _context.TaskItems.AnyAsync(t => t.Id == taskId);
            if (!exists)
            {
                return NotFound(new { message = "Task not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, taskId))
            {
                return Forbid();
            }

            var attachments = await _context.Attachments
                .AsNoTracking()
                .Where(a => a.TaskItemId == taskId)
                .OrderByDescending(a => a.UploadedAt)
                .Select(a => new AttachmentResponse
                {
                    Id = a.Id,
                    TaskItemId = a.TaskItemId,
                    TaskTitle = a.TaskItem.Title,
                    FileName = a.FileName,
                    FileUrl = a.FileUrl,
                    ContentType = a.ContentType,
                    FileSize = a.FileSize,
                    UploadedAt = a.UploadedAt
                })
                .ToListAsync();

            return Ok(attachments);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,User")]
        public async Task<ActionResult<AttachmentResponse>> CreateAttachment(
            CreateAttachmentRequest request)
        {
            var task = await _context.TaskItems
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == request.TaskItemId);

            if (task == null) return BadRequest(new { message = "The specified task does not exist." });
            if (!await _access.CanAccessTaskAsync(User, request.TaskItemId)) return Forbid();

            var attachment = new Attachment
            {
                TaskItemId = request.TaskItemId,
                FileName = request.FileName.Trim(),
                FileUrl = request.FileUrl.Trim(),
                ContentType = request.ContentType?.Trim(),
                FileSize = request.FileSize,
                UploadedAt = DateTime.UtcNow
            };

            _context.Attachments.Add(attachment);
            await _context.SaveChangesAsync();

            return Ok(new AttachmentResponse
            {
                Id = attachment.Id,
                TaskItemId = attachment.TaskItemId,
                TaskTitle = task.Title,
                FileName = attachment.FileName,
                FileUrl = attachment.FileUrl,
                ContentType = attachment.ContentType,
                FileSize = attachment.FileSize,
                UploadedAt = attachment.UploadedAt
            });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> DeleteAttachment(int id)
        {
            var attachment = await _context.Attachments
                .FirstOrDefaultAsync(a => a.Id == id);

            if (attachment == null)
            {
                return NotFound(new { message = "Attachment not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, attachment.TaskItemId))
            {
                return Forbid();
            }

            _context.Attachments.Remove(attachment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Attachment deleted successfully." });
        }
    }
}
