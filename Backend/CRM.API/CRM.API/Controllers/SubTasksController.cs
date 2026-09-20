using CRM.API.Data;
using CRM.API.DTOs.SubTask;
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
    public class SubTasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AccessControlService _access;

        public SubTasksController(
            ApplicationDbContext context,
            AccessControlService access)
        {
            _context = context;
            _access = access;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<SubTaskResponse>>> GetSubTasks()
        {
            var items = await _context.SubTasks
                .AsNoTracking()
                .OrderBy(s => s.Id)
                .Select(s => new SubTaskResponse
                {
                    Id = s.Id,
                    TaskItemId = s.TaskItemId,
                    TaskTitle = s.TaskItem.Title,
                    Title = s.Title,
                    IsCompleted = s.IsCompleted,
                    DueDate = s.DueDate
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<SubTaskResponse>> GetSubTask(int id)
        {
            var item = await _context.SubTasks
                .AsNoTracking()
                .Where(s => s.Id == id)
                .Select(s => new SubTaskResponse
                {
                    Id = s.Id,
                    TaskItemId = s.TaskItemId,
                    TaskTitle = s.TaskItem.Title,
                    Title = s.Title,
                    IsCompleted = s.IsCompleted,
                    DueDate = s.DueDate
                })
                .FirstOrDefaultAsync();

            if (item == null)
            {
                return NotFound(new { message = "Subtask not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, item.TaskItemId))
            {
                return Forbid();
            }

            return Ok(item);
        }

        [HttpGet("task/{taskId:int}")]
        public async Task<ActionResult<IEnumerable<SubTaskResponse>>> GetSubTasksByTask(
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

            var items = await _context.SubTasks
                .AsNoTracking()
                .Where(s => s.TaskItemId == taskId)
                .OrderBy(s => s.Id)
                .Select(s => new SubTaskResponse
                {
                    Id = s.Id,
                    TaskItemId = s.TaskItemId,
                    TaskTitle = s.TaskItem.Title,
                    Title = s.Title,
                    IsCompleted = s.IsCompleted,
                    DueDate = s.DueDate
                })
                .ToListAsync();

            return Ok(items);
        }

        [HttpPost]
        [Authorize(Roles = "Admin,User")]
        public async Task<ActionResult<SubTaskResponse>> CreateSubTask(
            CreateSubTaskRequest request)
        {
            var task = await _context.TaskItems
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == request.TaskItemId);

            if (task == null) return BadRequest(new { message = "The specified task does not exist." });
            if (!await _access.CanAccessTaskAsync(User, request.TaskItemId)) return Forbid();

            var item = new SubTask
            {
                TaskItemId = request.TaskItemId,
                Title = request.Title.Trim(),
                IsCompleted = false,
                DueDate = request.DueDate
            };

            _context.SubTasks.Add(item);
            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetSubTask),
                new { id = item.Id },
                new SubTaskResponse
                {
                    Id = item.Id,
                    TaskItemId = item.TaskItemId,
                    TaskTitle = task.Title,
                    Title = item.Title,
                    IsCompleted = item.IsCompleted,
                    DueDate = item.DueDate
                });
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> UpdateSubTask(
            int id,
            UpdateSubTaskRequest request)
        {
            var item = await _context.SubTasks.FirstOrDefaultAsync(s => s.Id == id);
            if (item == null)
            {
                return NotFound(new { message = "Subtask not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, item.TaskItemId))
            {
                return Forbid();
            }

            item.Title = request.Title.Trim();
            item.IsCompleted = request.IsCompleted;
            item.DueDate = request.DueDate;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Subtask updated successfully." });
        }

        [HttpPatch("{id:int}/complete")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> CompleteSubTask(int id)
        {
            var item = await _context.SubTasks.FirstOrDefaultAsync(s => s.Id == id);
            if (item == null)
            {
                return NotFound(new { message = "Subtask not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, item.TaskItemId))
            {
                return Forbid();
            }

            item.IsCompleted = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Subtask completed successfully." });
        }

        [HttpPatch("{id:int}/uncomplete")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> UncompleteSubTask(int id)
        {
            var item = await _context.SubTasks.FirstOrDefaultAsync(s => s.Id == id);
            if (item == null)
            {
                return NotFound(new { message = "Subtask not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, item.TaskItemId))
            {
                return Forbid();
            }

            item.IsCompleted = false;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Subtask marked incomplete successfully." });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> DeleteSubTask(int id)
        {
            var item = await _context.SubTasks.FirstOrDefaultAsync(s => s.Id == id);
            if (item == null)
            {
                return NotFound(new { message = "Subtask not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, item.TaskItemId))
            {
                return Forbid();
            }

            _context.SubTasks.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Subtask deleted successfully." });
        }
    }
}
