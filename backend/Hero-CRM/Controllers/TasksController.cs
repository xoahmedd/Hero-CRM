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
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

namespace Hero_CRM.Controllers
{
    [Authorize]
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

        private int CurrentUserId
        {
            get
            {
                var claimVal = User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? User.FindFirst("nameid")?.Value
                            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                            ?? User.FindFirst("sub")?.Value
                            ?? User.FindFirst(ClaimTypes.Name)?.Value;
                return int.TryParse(claimVal, out var id) ? id : 0;
            }
        }

        private bool IsAdmin =>
            User.IsInRole("Admin")
            || User.HasClaim(ClaimTypes.Role, "Admin")
            || User.HasClaim("role", "Admin")
            || User.HasClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "Admin");

        private async Task<TaskResponse> MapToResponseAsync(TaskItem task)
        {
            var response = _mapper.Map<TaskResponse>(task);

            var project = await _projectRepo.GetByIdAsync(task.ProjectId);
            response.ProjectName = project?.Name;

            var creator = await _userManager.FindByIdAsync(task.CreatedById.ToString());
            response.CreatedByName = creator?.FullName;

            var assignees = await _context.TaskAssignees
                .AsNoTracking()
                .Where(a => a.TaskItemId == task.Id)
                .ToListAsync();

            foreach (var a in assignees)
            {
                var user = await _userManager.FindByIdAsync(a.UserId.ToString());
                response.Assignees.Add(new TaskAssigneeResponse
                {
                    UserId = a.UserId,
                    FullName = user?.FullName ?? string.Empty,
                    Email = user?.Email ?? string.Empty,
                    ProfileImage = user?.ProfileImage,
                    AssignedAt = a.AssignedAt
                });
            }

            response.CompletedAt = task.CompletedAt;
            response.IsOverdue = !string.IsNullOrEmpty(task.MissedDeadlineReason) ||
                                 (task.DueDate.HasValue && (
                                     task.Status == TaskItemStatus.Completed
                                         ? (task.CompletedAt.HasValue && task.CompletedAt.Value > task.DueDate.Value)
                                         : (task.DueDate.Value < DateTime.UtcNow && task.Status != TaskItemStatus.Cancelled)
                                 ));
            response.MissedDeadlineReason = task.MissedDeadlineReason;
            response.ReasonCategory = task.ReasonCategory;

            return response;
        }

        private async Task SyncProjectStatusAsync(int projectId)
        {
            var project = await _projectRepo.GetByIdAsync(projectId);
            if (project == null || project.Status == ProjectStatus.Cancelled) return;

            var tasks = await _context.TaskItems
                .AsNoTracking()
                .Where(t => t.ProjectId == projectId)
                .Select(t => t.Status)
                .ToListAsync();

            if (!tasks.Any()) return;

            bool hasCompleted = tasks.Any(s => s == TaskItemStatus.Completed);
            bool allCompletedOrCancelled = tasks.All(s => s == TaskItemStatus.Completed || s == TaskItemStatus.Cancelled);
            bool isAutoFinished = hasCompleted && allCompletedOrCancelled;

            if (isAutoFinished)
            {
                if (project.Status != ProjectStatus.Finished)
                {
                    project.Status = ProjectStatus.Finished;
                    project.UpdatedAt = DateTime.UtcNow;
                    _projectRepo.Update(project);
                    await _projectRepo.SaveChangesAsync();
                }
            }
            else
            {
                if (project.Status == ProjectStatus.Finished)
                {
                    project.Status = ProjectStatus.InProgress;
                    project.UpdatedAt = DateTime.UtcNow;
                    _projectRepo.Update(project);
                    await _projectRepo.SaveChangesAsync();
                }
            }
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
            var query = _taskRepo.GetQueryable();

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                query = query.Where(t => t.Assignees.Any(a => a.UserId == userId));
            }

            if (pageIndex.HasValue || pageSize.HasValue || !string.IsNullOrWhiteSpace(search) || status.HasValue || priority.HasValue)
            {
                var s = search?.Trim();

                if (!string.IsNullOrWhiteSpace(s))
                {
                    query = query.Where(t =>
                        t.Title.Contains(s) ||
                        (t.Description != null && t.Description.Contains(s)));
                }

                if (status.HasValue)
                {
                    query = query.Where(t => t.Status == status.Value);
                }

                if (priority.HasValue)
                {
                    query = query.Where(t => t.Priority == priority.Value);
                }

                var totalCount = await query.CountAsync();
                var pagedTasks = await query
                    .OrderBy(t => t.DueDate == null)
                    .ThenBy(t => t.DueDate)
                    .ThenByDescending(t => t.CreatedAt)
                    .Skip(((pageIndex ?? 1) - 1) * (pageSize ?? 20))
                    .Take(pageSize ?? 20)
                    .ToListAsync();

                var responses = new List<TaskResponse>();
                foreach (var t in pagedTasks)
                {
                    responses.Add(await MapToResponseAsync(t));
                }

                return Ok(new Pagination<TaskResponse>(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    totalCount,
                    responses));
            }

            var tasks = await query
                .OrderBy(t => t.DueDate == null)
                .ThenBy(t => t.DueDate)
                .ThenByDescending(t => t.CreatedAt)
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

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                var isAssigned = await _taskRepo.GetQueryable()
                    .Where(t => t.Id == id && t.Assignees.Any(a => a.UserId == userId))
                    .AnyAsync();

                if (!isAssigned)
                {
                    return Forbid();
                }
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

            var query = _taskRepo.GetQueryable()
                .Where(t => t.ProjectId == projectId);

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                query = query.Where(t => t.Assignees.Any(a => a.UserId == userId));
            }

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var totalCount = await query.CountAsync();
                var pagedTasks = await query
                    .OrderBy(t => t.DueDate == null)
                    .ThenBy(t => t.DueDate)
                    .ThenByDescending(t => t.CreatedAt)
                    .Skip(((pageIndex ?? 1) - 1) * (pageSize ?? 20))
                    .Take(pageSize ?? 20)
                    .ToListAsync();

                var responses = new List<TaskResponse>();
                foreach (var t in pagedTasks)
                {
                    var resp = await MapToResponseAsync(t);
                    resp.ProjectName = project.Name;
                    responses.Add(resp);
                }

                return Ok(new Pagination<TaskResponse>(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    totalCount,
                    responses));
            }

            var projectTasks = await query
                .OrderBy(t => t.DueDate == null)
                .ThenBy(t => t.DueDate)
                .ThenByDescending(t => t.CreatedAt)
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
        public async Task<IActionResult> GetTasksByCreator(int userId)
        {
            if (!IsAdmin && userId != CurrentUserId)
            {
                return Forbid();
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null)
            {
                return NotFound(new
                {
                    message = "Creator user not found."
                });
            }

            var creatorTasks = await _taskRepo.GetQueryable()
                .Where(t => t.CreatedById == userId)
                .OrderBy(t => t.DueDate == null)
                .ThenBy(t => t.DueDate)
                .ThenByDescending(t => t.CreatedAt)
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
                targetUserId = CurrentUserId;
            }

            if (!IsAdmin && targetUserId != CurrentUserId)
            {
                return Forbid();
            }

            if (!targetUserId.HasValue || targetUserId.Value == 0)
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
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<TaskResponse>> CreateTask(CreateTaskRequest request)
        {
            if (!IsAdmin)
            {
                return Forbid();
            }

            var project = await _projectRepo.GetByIdAsync(request.ProjectId);

            if (project == null)
            {
                return BadRequest(new
                {
                    message = "The specified project does not exist."
                });
            }

            if (project.Status == ProjectStatus.Cancelled)
            {
                return BadRequest(new
                {
                    message = "Cannot add tasks to a cancelled project. Reopen the project (set status to In Progress) first."
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

            // Validate that all assignees are assigned to the project
            if (request.AssigneeIds != null && request.AssigneeIds.Any())
            {
                var projectMemberUserIds = await _context.ProjectMembers
                    .Where(pm => pm.ProjectId == project.Id)
                    .Select(pm => pm.UserId)
                    .ToListAsync();
                projectMemberUserIds.Add(project.OwnerId);

                var invalidAssignees = request.AssigneeIds.Distinct().Where(uid => !projectMemberUserIds.Contains(uid)).ToList();
                if (invalidAssignees.Any())
                {
                    return BadRequest(new
                    {
                        message = "Only developers assigned to this project can be assigned to its tasks."
                    });
                }
            }

            await _taskRepo.AddAsync(task);
            await _taskRepo.SaveChangesAsync();

            if (request.AssigneeIds != null && request.AssigneeIds.Any())
            {
                foreach (var userId in request.AssigneeIds.Distinct())
                {
                    var user = await _userManager.FindByIdAsync(userId.ToString());
                    if (user != null)
                    {
                        _context.TaskAssignees.Add(new TaskAssignee
                        {
                            TaskItemId = task.Id,
                            UserId = userId,
                            AssignedAt = DateTime.UtcNow
                        });

                        await _notificationService.NotifyTaskAssignmentAsync(userId, task.Id, task.Title, project.Name);
                    }
                }
                await _context.SaveChangesAsync();
            }

            await SyncProjectStatusAsync(task.ProjectId);

            var response = await MapToResponseAsync(task);
            response.ProjectName = project.Name;
            response.CreatedByName = creator.FullName;

            return CreatedAtAction(
                nameof(GetTask),
                new { id = task.Id },
                response);
        }

        // PUT: api/Tasks/5
        [Authorize(Roles = "Admin")]
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

            if (!IsAdmin)
            {
                return Forbid();
            }

            var project = await _projectRepo.GetByIdAsync(task.ProjectId);
            if (project != null && project.Status == ProjectStatus.Cancelled)
            {
                if (request.Status.HasValue && request.Status.Value != task.Status)
                {
                    if (request.Status.Value == TaskItemStatus.Assigned || request.Status.Value == TaskItemStatus.Review)
                    {
                        return BadRequest(new
                        {
                            message = "Cannot move tasks to In Progress or Review while the project is cancelled. Please change project status to In Progress first."
                        });
                    }
                }
            }

            // Validate that all assignees are assigned to the project
            if (request.AssigneeIds != null && request.AssigneeIds.Any() && project != null)
            {
                var projectMemberUserIds = await _context.ProjectMembers
                    .Where(pm => pm.ProjectId == project.Id)
                    .Select(pm => pm.UserId)
                    .ToListAsync();
                projectMemberUserIds.Add(project.OwnerId);

                var invalidAssignees = request.AssigneeIds.Distinct().Where(uid => !projectMemberUserIds.Contains(uid)).ToList();
                if (invalidAssignees.Any())
                {
                    return BadRequest(new
                    {
                        message = "Only developers assigned to this project can be assigned to its tasks."
                    });
                }
            }

            if (request.Status.HasValue)
            {
                if (request.Status.Value == TaskItemStatus.Completed && task.Status != TaskItemStatus.Completed)
                {
                    task.CompletedAt = DateTime.UtcNow;
                }
                else if (request.Status.Value != TaskItemStatus.Completed && task.Status == TaskItemStatus.Completed)
                {
                    task.CompletedAt = null;
                }
            }

            _mapper.Map(request, task);

            _taskRepo.Update(task);
            await _taskRepo.SaveChangesAsync();

            if (request.AssigneeIds != null)
            {
                var projectName = project?.Name ?? "Project";

                var existingAssignees = await _context.TaskAssignees
                    .Where(ta => ta.TaskItemId == id)
                    .ToListAsync();

                var targetIds = request.AssigneeIds.Distinct().ToHashSet();

                var toRemove = existingAssignees.Where(ta => !targetIds.Contains(ta.UserId)).ToList();
                if (toRemove.Any())
                {
                    _context.TaskAssignees.RemoveRange(toRemove);
                }

                var existingIds = existingAssignees.Select(ta => ta.UserId).ToHashSet();
                var toAdd = targetIds.Where(uid => !existingIds.Contains(uid)).ToList();
                foreach (var newUserId in toAdd)
                {
                    var user = await _userManager.FindByIdAsync(newUserId.ToString());
                    if (user != null)
                    {
                        _context.TaskAssignees.Add(new TaskAssignee
                        {
                            TaskItemId = id,
                            UserId = newUserId,
                            AssignedAt = DateTime.UtcNow
                        });
                        await _notificationService.NotifyTaskAssignmentAsync(newUserId, task.Id, task.Title, projectName);
                    }
                }
                await _context.SaveChangesAsync();
            }

            await SyncProjectStatusAsync(task.ProjectId);

            var updatedResponse = await MapToResponseAsync(task);

            return Ok(new
            {
                message = "Task updated successfully.",
                task = updatedResponse
            });
        }

        // DELETE: api/Tasks/5
        [Authorize(Roles = "Admin")]
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

            if (!IsAdmin)
            {
                return Forbid();
            }

            var notifs = await _context.Notifications
                .Where(n => n.TaskId == id)
                .ToListAsync();
            if (notifs.Any())
            {
                _context.Notifications.RemoveRange(notifs);
                await _context.SaveChangesAsync();
            }

            var projectId = task.ProjectId;
            _taskRepo.Delete(task);
            await _taskRepo.SaveChangesAsync();
            await SyncProjectStatusAsync(projectId);

            return Ok(new
            {
                message = "Task deleted successfully."
            });
        }

        // POST: api/Tasks/{taskId}/assignees/{userId}
        [Authorize(Roles = "Admin")]
        [HttpPost("{taskId:int}/assignees/{userId:int}")]
        public async Task<IActionResult> AssignUserToTask(int taskId, int userId)
        {
            if (!IsAdmin)
            {
                return Forbid();
            }

            var task = await _taskRepo.GetByIdAsync(taskId);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            var project = await _projectRepo.GetByIdAsync(task.ProjectId);
            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            var isProjectMember = project.OwnerId == userId ||
                await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == project.Id && pm.UserId == userId);

            if (!isProjectMember)
            {
                return BadRequest(new
                {
                    message = "Only developers assigned to this project can be assigned to its tasks."
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

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                var isAssigned = await _context.TaskAssignees.AnyAsync(a => a.TaskItemId == id && a.UserId == userId);
                if (!isAssigned && task.CreatedById != userId)
                {
                    return Forbid();
                }
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
            var query = _taskRepo.GetQueryable()
                .Where(t => t.DueDate.HasValue && t.DueDate < now && t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled);

            if (!IsAdmin)
            {
                var currentId = CurrentUserId;
                query = query.Where(t => t.Assignees.Any(a => a.UserId == currentId));
            }

            var overdueTasks = await query
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
            if (!IsAdmin && userId != CurrentUserId)
            {
                return Forbid();
            }

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
        [Authorize(Roles = "Admin")]
        [HttpDelete("{taskId:int}/assignees/{userId:int}")]
        public async Task<IActionResult> RemoveUserFromTask(int taskId, int userId)
        {
            if (!IsAdmin)
            {
                return Forbid();
            }

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
        public async Task<IActionResult> UpdateTaskStatus(
            int id,
            [FromQuery] TaskItemStatus? status = null,
            [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] UpdateTaskStatusDto? dto = null)
        {
            var targetStatus = dto?.Status ?? status;
            if (!targetStatus.HasValue)
            {
                return BadRequest(new
                {
                    message = "Status is required."
                });
            }

            var task = await _taskRepo.GetByIdAsync(id);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            var project = await _projectRepo.GetByIdAsync(task.ProjectId);
            if (project != null && project.Status == ProjectStatus.Cancelled)
            {
                if (targetStatus.Value == TaskItemStatus.Assigned || targetStatus.Value == TaskItemStatus.Review)
                {
                    return BadRequest(new
                    {
                        message = "Cannot move tasks to In Progress or Review while the project is cancelled. Please change project status to In Progress first."
                    });
                }
            }

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                var isAssignee = await _context.TaskAssignees
                    .AnyAsync(a => a.TaskItemId == id && a.UserId == userId);

                if (!isAssignee)
                {
                    return StatusCode(403, new
                    {
                        message = "Forbidden: You are not assigned to this task."
                    });
                }

                // Developer can only move tasks to Review
                if (targetStatus.Value != TaskItemStatus.Review)
                {
                    return BadRequest(new
                    {
                        message = "Developers can only submit assigned tasks for Review."
                    });
                }

                if (task.Status != TaskItemStatus.Assigned)
                {
                    return BadRequest(new
                    {
                        message = "Only tasks in Assigned status can be submitted for Review."
                    });
                }
            }

            if (targetStatus.Value == TaskItemStatus.Completed && task.Status != TaskItemStatus.Completed)
            {
                task.CompletedAt = DateTime.UtcNow;
            }
            else if (targetStatus.Value != TaskItemStatus.Completed && task.Status == TaskItemStatus.Completed)
            {
                task.CompletedAt = null;
            }

            task.Status = targetStatus.Value;
            task.UpdatedAt = DateTime.UtcNow;

            _taskRepo.Update(task);
            await _taskRepo.SaveChangesAsync();
            await SyncProjectStatusAsync(task.ProjectId);

            // Notify on status transition
            try
            {
                if (targetStatus.Value == TaskItemStatus.Review)
                {
                    var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");
                    if (adminRole != null)
                    {
                        var adminUserIds = await _context.UserRoles
                            .Where(ur => ur.RoleId == adminRole.Id)
                            .Select(ur => ur.UserId)
                            .ToListAsync();

                        foreach (var adminId in adminUserIds)
                        {
                            await _notificationService.SendNotificationAsync(
                                adminId,
                                "Task Submitted for Review",
                                $"Task '{task.Title}' has been submitted for review.",
                                NotificationType.General,
                                task.ProjectId,
                                task.Id);
                        }
                    }
                }
                else if (IsAdmin)
                {
                    var assigneeIds = await _context.TaskAssignees
                        .Where(a => a.TaskItemId == id)
                        .Select(a => a.UserId)
                        .ToListAsync();

                    foreach (var aId in assigneeIds)
                    {
                        await _notificationService.SendNotificationAsync(
                            aId,
                            $"Task Status: {targetStatus.Value}",
                            $"Admin updated status of task '{task.Title}' to {targetStatus.Value}.",
                            NotificationType.General,
                            task.ProjectId,
                            task.Id);
                    }
                }
            }
            catch
            {
                // Status update succeeded; notification failure should not block response
            }

            return Ok(new
            {
                message = "Task status updated successfully.",
                taskId = id,
                status = task.Status
            });
        }

        // PATCH: api/Tasks/{id}/priority
        [Authorize(Roles = "Admin")]
        [HttpPatch("{id:int}/priority")]
        public async Task<IActionResult> UpdateTaskPriority(int id, [FromQuery] TaskPriority priority)
        {
            if (!IsAdmin)
            {
                return Forbid();
            }

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

    public class UpdateTaskStatusDto
    {
        public TaskItemStatus? Status { get; set; }
    }
}
