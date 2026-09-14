using Application.Common;
using System.Security.Claims;
using Application.DTOs.Common;
using Application.DTOs.Tasks.TaskItem;
using Application.Repos_Interfaces;
using Application.Services_Interfaces;
using AutoMapper;
using Domain.Entities.Identity;
using Domain.Entities.Projects;
using Domain.Entities.Tasks;
using Domain.Enums;
using Infrastructure._Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly IGenericRepository<TaskItem> _taskRepo;
        private readonly IGenericRepository<Project> _projectRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IMapper _mapper;

        public TasksController(
            IGenericRepository<TaskItem> taskRepo,
            IGenericRepository<Project> projectRepo,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context,
            INotificationService notificationService,
            IMapper mapper)
        {
            _taskRepo = taskRepo;
            _projectRepo = projectRepo;
            _userManager = userManager;
            _context = context;
            _notificationService = notificationService;
            _mapper = mapper;
        }

        private async Task<TaskResponse> MapToResponseAsync(TaskItem task)
        {
            var response = _mapper.Map<TaskResponse>(task);

            var project = await _projectRepo.GetByIdAsync(task.ProjectId);
            response.ProjectName = project?.Name;

            var creator = await _userManager.FindByIdAsync(task.CreatedById.ToString());
            response.CreatedByName = creator?.FullName;

            return response;
        }

        // GET: api/Tasks
        [HttpGet]
        public async Task<IActionResult> GetTasks(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] string? search = null,
            [FromQuery] TaskItemStatus? status = null,
            [FromQuery] TaskPriority? priority = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue || !string.IsNullOrWhiteSpace(search) || status.HasValue || priority.HasValue)
            {
                var s = search?.Trim();

                var pagedTasks = await _taskRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: t =>
                        (string.IsNullOrWhiteSpace(s) || (
                            t.Title.Contains(s) ||
                            (t.Description != null && t.Description.Contains(s))
                        )) &&
                        (!status.HasValue || t.Status == status.Value) &&
                        (!priority.HasValue || t.Priority == priority.Value),
                    orderBy: q => q.OrderByDescending(t => t.CreatedAt));

                var responses = new List<TaskResponse>();
                foreach (var t in pagedTasks.Data)
                {
                    responses.Add(await MapToResponseAsync(t));
                }

                return Ok(new Pagination<TaskResponse>(
                    pagedTasks.PageIndex,
                    pagedTasks.PageSize,
                    pagedTasks.Count,
                    responses));
            }

            var tasks = await _taskRepo.GetQueryable()
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var list = new List<TaskResponse>();
            foreach (var t in tasks)
            {
                list.Add(await MapToResponseAsync(t));
            }

            return Ok(list);
        }

        // GET: api/Tasks/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<TaskResponse>> GetTask(int id)
        {
            var task = await _taskRepo.GetByIdAsync(id);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            var response = await MapToResponseAsync(task);
            return Ok(response);
        }

        // GET: api/Tasks/project/1
        [HttpGet("project/{projectId:int}")]
        public async Task<IActionResult> GetTasksByProject(
            int projectId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var project = await _projectRepo.GetByIdAsync(projectId);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedTasks = await _taskRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: t => t.ProjectId == projectId,
                    orderBy: q => q.OrderByDescending(t => t.CreatedAt));

                var responses = new List<TaskResponse>();
                foreach (var t in pagedTasks.Data)
                {
                    var resp = await MapToResponseAsync(t);
                    resp.ProjectName = project.Name;
                    responses.Add(resp);
                }

                return Ok(new Pagination<TaskResponse>(
                    pagedTasks.PageIndex,
                    pagedTasks.PageSize,
                    pagedTasks.Count,
                    responses));
            }

            var projectTasks = await _taskRepo.GetQueryable()
                .Where(t => t.ProjectId == projectId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var list = new List<TaskResponse>();
            foreach (var t in projectTasks)
            {
                var resp = await MapToResponseAsync(t);
                resp.ProjectName = project.Name;
                list.Add(resp);
            }

            return Ok(list);
        }

        // GET: api/Tasks/creator/1
        [HttpGet("creator/{userId:int}")]
        public async Task<IActionResult> GetTasksByCreator(
            int userId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedTasks = await _taskRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: t => t.CreatedById == userId,
                    orderBy: q => q.OrderByDescending(t => t.CreatedAt));

                var responses = new List<TaskResponse>();
                foreach (var t in pagedTasks.Data)
                {
                    var resp = await MapToResponseAsync(t);
                    resp.CreatedByName = user.FullName;
                    responses.Add(resp);
                }

                return Ok(new Pagination<TaskResponse>(
                    pagedTasks.PageIndex,
                    pagedTasks.PageSize,
                    pagedTasks.Count,
                    responses));
            }

            var creatorTasks = await _taskRepo.GetQueryable()
                .Where(t => t.CreatedById == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var list = new List<TaskResponse>();
            foreach (var t in creatorTasks)
            {
                var resp = await MapToResponseAsync(t);
                resp.CreatedByName = user.FullName;
                list.Add(resp);
            }

            return Ok(list);
        }

        // GET: api/Tasks/my
        [HttpGet("my")]
        public async Task<IActionResult> GetMyTasks(
            [FromQuery] int? userId = null,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var targetUserId = userId;
            if (!targetUserId.HasValue)
            {
                var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(userIdValue, out var parsedId))
                {
                    targetUserId = parsedId;
                }
            }

            if (!targetUserId.HasValue)
            {
                return BadRequest(new
                {
                    message = "UserId parameter is required when unauthenticated."
                });
            }

            var baseQuery = _context.TaskAssignees
                .AsNoTracking()
                .Where(ta => ta.UserId == targetUserId.Value)
                .Join(
                    _taskRepo.GetQueryable(),
                    ta => ta.TaskItemId,
                    task => task.Id,
                    (ta, task) => task)
                .OrderBy(t => t.DueDate == null)
                .ThenBy(t => t.DueDate)
                .ThenByDescending(t => t.CreatedAt);

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var index = pageIndex ?? 1;
                var size = pageSize ?? 20;

                var totalCount = await baseQuery.CountAsync();

                var pagedTasks = await baseQuery
                    .Skip((index - 1) * size)
                    .Take(size)
                    .ToListAsync();

                var pagedResponses = new List<TaskResponse>();
                foreach (var t in pagedTasks)
                {
                    pagedResponses.Add(await MapToResponseAsync(t));
                }

                return Ok(new Pagination<TaskResponse>(index, size, totalCount, pagedResponses));
            }

            var myTasksList = await baseQuery.ToListAsync();
            var responses = new List<TaskResponse>();
            foreach (var t in myTasksList)
            {
                responses.Add(await MapToResponseAsync(t));
            }

            return Ok(responses);
        }



        // POST: api/Tasks
        [HttpPost]
        public async Task<ActionResult<TaskResponse>> CreateTask(CreateTaskRequest request)
        {
            var project = await _projectRepo.GetByIdAsync(request.ProjectId);

            if (project == null)
            {
                return BadRequest(new
                {
                    message = "The specified project does not exist."
                });
            }

            var creator = await _userManager.FindByIdAsync(request.CreatedById.ToString());

            if (creator == null)
            {
                return BadRequest(new
                {
                    message = "The specified creator does not exist."
                });
            }

            var task = _mapper.Map<TaskItem>(request);

            await _taskRepo.AddAsync(task);
            await _taskRepo.SaveChangesAsync();

            var response = _mapper.Map<TaskResponse>(task);
            response.ProjectName = project.Name;
            response.CreatedByName = creator.FullName;

            return CreatedAtAction(
                nameof(GetTask),
                new { id = task.Id },
                response);
        }

        // PUT: api/Tasks/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTask(int id, UpdateTaskRequest request)
        {
            var task = await _taskRepo.GetByIdAsync(id);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            _mapper.Map(request, task);

            _taskRepo.Update(task);
            await _taskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Task updated successfully."
            });
        }

        // DELETE: api/Tasks/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _taskRepo.GetByIdAsync(id);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            _taskRepo.Delete(task);
            await _taskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Task deleted successfully."
            });
        }

        // POST: api/Tasks/{taskId}/assignees/{userId}
        [HttpPost("{taskId:int}/assignees/{userId:int}")]
        public async Task<IActionResult> AssignUserToTask(int taskId, int userId)
        {
            var task = await _taskRepo.GetByIdAsync(taskId);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null || !user.IsActive)
            {
                return NotFound(new
                {
                    message = "User not found or inactive."
                });
            }

            var alreadyAssigned = await _context.TaskAssignees
                .AnyAsync(a => a.TaskItemId == taskId && a.UserId == userId);

            if (alreadyAssigned)
            {
                return Conflict(new
                {
                    message = "User is already assigned to this task."
                });
            }

            var assignment = new TaskAssignee
            {
                TaskItemId = taskId,
                UserId = userId,
                AssignedAt = DateTime.UtcNow
            };

            _context.TaskAssignees.Add(assignment);

            await _context.SaveChangesAsync();

            var project = await _projectRepo.GetByIdAsync(task.ProjectId);
            await _notificationService.NotifyTaskAssignmentAsync(userId, taskId, task.Title, project?.Name ?? "Project");

            return Ok(new
            {
                message = "User assigned to task successfully.",
                taskId,
                userId
            });
        }

        // PUT: api/Tasks/5/missed-reason
        [HttpPut("{id:int}/missed-reason")]
        public async Task<IActionResult> SubmitMissedTaskDeadlineReason(int id, [FromBody] SubmitMissedReasonDto dto)
        {
            var task = await _taskRepo.GetByIdAsync(id);

            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.Reason))
            {
                return BadRequest(new { message = "Reason cannot be empty." });
            }

            task.MissedDeadlineReason = dto.Reason.Trim();
            task.ReasonCategory = string.IsNullOrWhiteSpace(dto.Category) ? "Other" : dto.Category.Trim();
            task.UpdatedAt = DateTime.UtcNow;

            _taskRepo.Update(task);
            await _taskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Task missed deadline reason submitted successfully.",
                taskId = task.Id,
                reasonCategory = task.ReasonCategory,
                missedDeadlineReason = task.MissedDeadlineReason
            });
        }

        // GET: api/Tasks/overdue
        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdueTasks()
        {
            var now = DateTime.UtcNow;
            var overdueTasks = await _taskRepo.GetQueryable()
                .Where(t => t.DueDate.HasValue && t.DueDate < now && t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled)
                .OrderByDescending(t => t.DueDate)
                .ToListAsync();

            var result = new List<TaskResponse>();
            foreach (var t in overdueTasks)
            {
                result.Add(await MapToResponseAsync(t));
            }

            return Ok(result);
        }

        // GET: api/Tasks/assigned/5
        [HttpGet("assigned/{userId:int}")]
        public async Task<IActionResult> GetTasksAssignedToUser(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var taskIds = await _context.TaskAssignees
                .Where(ta => ta.UserId == userId)
                .Select(ta => ta.TaskItemId)
                .ToListAsync();

            var tasks = await _taskRepo.GetQueryable()
                .Where(t => taskIds.Contains(t.Id))
                .OrderBy(t => t.DueDate == null)
                .ThenBy(t => t.DueDate)
                .ToListAsync();

            var result = new List<TaskResponse>();
            foreach (var t in tasks)
            {
                result.Add(await MapToResponseAsync(t));
            }

            return Ok(result);
        }

        // GET: api/Tasks/{taskId}/assignees
        [HttpGet("{taskId:int}/assignees")]
        public async Task<ActionResult<IEnumerable<TaskAssigneeResponse>>> GetTaskAssignees(int taskId)
        {
            var task = await _taskRepo.GetByIdAsync(taskId);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            var assignees = await _context.TaskAssignees
                .AsNoTracking()
                .Where(a => a.TaskItemId == taskId)
                .OrderBy(a => a.AssignedAt)
                .ToListAsync();

            var list = new List<TaskAssigneeResponse>();
            foreach (var a in assignees)
            {
                var user = await _userManager.FindByIdAsync(a.UserId.ToString());
                list.Add(new TaskAssigneeResponse
                {
                    UserId = a.UserId,
                    FullName = user?.FullName ?? string.Empty,
                    Email = user?.Email ?? string.Empty,
                    ProfileImage = user?.ProfileImage,
                    AssignedAt = a.AssignedAt
                });
            }

            return Ok(list);
        }

        // DELETE: api/Tasks/{taskId}/assignees/{userId}
        [HttpDelete("{taskId:int}/assignees/{userId:int}")]
        public async Task<IActionResult> RemoveUserFromTask(int taskId, int userId)
        {
            var assignment = await _context.TaskAssignees
                .FirstOrDefaultAsync(a => a.TaskItemId == taskId && a.UserId == userId);

            if (assignment == null)
            {
                return NotFound(new
                {
                    message = "Task assignment not found."
                });
            }

            _context.TaskAssignees.Remove(assignment);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User removed from task successfully."
            });
        }

        // PATCH: api/Tasks/{id}/status
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int id, [FromQuery] TaskItemStatus status)
        {
            var task = await _taskRepo.GetByIdAsync(id);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            task.Status = status;
            task.UpdatedAt = DateTime.UtcNow;

            _taskRepo.Update(task);
            await _taskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Task status updated successfully.",
                taskId = id,
                status = task.Status
            });
        }

        // PATCH: api/Tasks/{id}/priority
        [HttpPatch("{id:int}/priority")]
        public async Task<IActionResult> UpdateTaskPriority(int id, [FromQuery] TaskPriority priority)
        {
            var task = await _taskRepo.GetByIdAsync(id);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            task.Priority = priority;
            task.UpdatedAt = DateTime.UtcNow;

            _taskRepo.Update(task);
            await _taskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Task priority updated successfully.",
                taskId = id,
                priority = task.Priority
            });
        }
    }
}
