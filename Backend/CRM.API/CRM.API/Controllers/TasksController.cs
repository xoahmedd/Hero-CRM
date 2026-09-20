using System.Security.Claims;
using CRM.API.Data;
using CRM.API.DTOs.TaskItem;
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
    public class TasksController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AccessControlService _access;
        private readonly ActivityLogger _activityLogger;
        private readonly WorkspaceNotificationService _notifications;

        public TasksController(
            ApplicationDbContext context,
            AccessControlService access,
            ActivityLogger activityLogger,
            WorkspaceNotificationService notifications)
        {
            _context = context;
            _access = access;
            _activityLogger = activityLogger;
            _notifications = notifications;
        }

        private void LogTaskActivity(TaskItem task, string action, string description)
        {
            var currentUserId = AccessControlService.GetUserId(User);
            if (!currentUserId.HasValue)
            {
                return;
            }

            _activityLogger.Add(
                currentUserId.Value,
                "Task",
                task.Id,
                action,
                description);

            if (task.ProjectId.HasValue)
            {
                _activityLogger.Add(
                    currentUserId.Value,
                    "Project",
                    task.ProjectId.Value,
                    action,
                    description);
            }
        }

        // =========================================================
        // GET: api/Tasks
        // Get all tasks
        // =========================================================

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<TaskResponse>>> GetTasks()
        {
            var tasks = await _context.TaskItems
                .AsNoTracking()
                .Include(t => t.Project)
                .Include(t => t.CreatedBy)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new TaskResponse
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,

                    ProjectId = t.ProjectId,
                    ProjectName = t.Project != null ? t.Project.Name : null,

                    CreatedById = t.CreatedById,
                    CreatedByName = t.CreatedBy.FullName,

                    DueDate = t.DueDate,

                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(tasks);
        }

        // =========================================================
        // GET: api/Tasks/5
        // Get task by ID
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<TaskResponse>> GetTask(int id)
        {
            var task = await _context.TaskItems
                .AsNoTracking()
                .Include(t => t.Project)
                .Include(t => t.CreatedBy)
                .Where(t => t.Id == id)
                .Select(t => new TaskResponse
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,

                    ProjectId = t.ProjectId,
                    ProjectName = t.Project != null ? t.Project.Name : null,

                    CreatedById = t.CreatedById,
                    CreatedByName = t.CreatedBy.FullName,

                    DueDate = t.DueDate,

                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .FirstOrDefaultAsync();

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            if (!await _access.CanAccessTaskAsync(User, id))
            {
                return Forbid();
            }

            return Ok(task);
        }

        // =========================================================
        // GET: api/Tasks/project/1
        // Get all tasks belonging to a project
        // =========================================================

        [HttpGet("project/{projectId:int}")]
        public async Task<ActionResult<IEnumerable<TaskResponse>>>
            GetTasksByProject(int projectId)
        {
            var projectExists = await _context.Projects
                .AnyAsync(p => p.Id == projectId);

            if (!projectExists)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (!await _access.CanAccessProjectAsync(User, projectId))
            {
                return Forbid();
            }

            var query = _context.TaskItems
                .AsNoTracking()
                .Where(t => t.ProjectId == projectId);

            if (!AccessControlService.IsManagementUser(User))
            {
                var userId = AccessControlService.GetUserId(User);
                if (userId == null) return Unauthorized(new { message = "Authenticated user could not be determined." });

                query = query.Where(t => t.Assignees.Any(a => a.UserId == userId.Value));
            }

            var tasks = await query
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new TaskResponse
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,

                    ProjectId = t.ProjectId,
                    ProjectName = t.Project != null ? t.Project.Name : null,

                    CreatedById = t.CreatedById,
                    CreatedByName = t.CreatedBy.FullName,

                    DueDate = t.DueDate,

                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(tasks);
        }

        // =========================================================
        // GET: api/Tasks/creator/1
        // Get tasks created by a specific user
        // =========================================================

        [HttpGet("creator/{userId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<TaskResponse>>>
            GetTasksByCreator(int userId)
        {
            var userExists = await _context.Users
                .AnyAsync(u => u.Id == userId);

            if (!userExists)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var tasks = await _context.TaskItems
                .AsNoTracking()
                .Include(t => t.Project)
                .Include(t => t.CreatedBy)
                .Where(t => t.CreatedById == userId)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new TaskResponse
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,

                    ProjectId = t.ProjectId,
                    ProjectName = t.Project != null ? t.Project.Name : null,

                    CreatedById = t.CreatedById,
                    CreatedByName = t.CreatedBy.FullName,

                    DueDate = t.DueDate,

                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(tasks);
        }

        // =========================================================
        // GET: api/Tasks/my
        // Get tasks assigned to the currently authenticated user
        // =========================================================

        [HttpGet("my")]
        public async Task<ActionResult<IEnumerable<TaskResponse>>> GetMyTasks()
        {
            var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdValue, out var userId))
            {
                return Unauthorized(new
                {
                    message = "Authenticated user could not be determined."
                });
            }

            var taskQuery = _context.TaskItems.AsNoTracking().AsQueryable();
            if (!AccessControlService.IsManagementUser(User))
                taskQuery = taskQuery.Where(t => t.Assignees.Any(a => a.UserId == userId));
            // Admin sees all tasks; Users see tasks assigned to them.

            var tasks = await taskQuery
                .OrderBy(t => t.DueDate == null).ThenBy(t => t.DueDate).ThenByDescending(t => t.CreatedAt)
                .Select(t => new TaskResponse
                {
                    Id = t.Id, Title = t.Title, Description = t.Description,
                    Status = t.Status, Priority = t.Priority,
                    ProjectId = t.ProjectId, ProjectName = t.Project != null ? t.Project.Name : null,
                    CreatedById = t.CreatedById, CreatedByName = t.CreatedBy.FullName,
                    DueDate = t.DueDate, CreatedAt = t.CreatedAt, UpdatedAt = t.UpdatedAt
                }).ToListAsync();

            return Ok(tasks);
        }

        // =========================================================
        // GET: api/Tasks/search?search=website
        // Search tasks
        // =========================================================

        [HttpGet("search")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<TaskResponse>>>
            SearchTasks([FromQuery] string search)
        {
            if (string.IsNullOrWhiteSpace(search))
            {
                return BadRequest(new
                {
                    message = "Search term is required."
                });
            }

            search = search.Trim();

            var tasks = await _context.TaskItems
                .AsNoTracking()
                .Include(t => t.Project)
                .Include(t => t.CreatedBy)
                .Where(t =>
                    t.Title.Contains(search) ||

                    (t.Description != null &&
                     t.Description.Contains(search)) ||

                    t.Status.Contains(search) ||

                    t.Priority.Contains(search) ||

                    (t.Project != null && t.Project.Name.Contains(search)) ||

                    t.CreatedBy.FullName.Contains(search))
                .OrderBy(t => t.Title)
                .Select(t => new TaskResponse
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    Priority = t.Priority,

                    ProjectId = t.ProjectId,
                    ProjectName = t.Project != null ? t.Project.Name : null,

                    CreatedById = t.CreatedById,
                    CreatedByName = t.CreatedBy.FullName,

                    DueDate = t.DueDate,

                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt
                })
                .ToListAsync();

            return Ok(tasks);
        }

        // =========================================================
        // POST: api/Tasks
        // Create task
        // =========================================================

        [HttpPost]
        [Authorize(Roles = "Admin,User")]
        public async Task<ActionResult<TaskResponse>>
            CreateTask(CreateTaskRequest request)
        {
            var currentUserId = AccessControlService.GetUserId(User);
            if (!currentUserId.HasValue)
            {
                return Unauthorized(new
                {
                    message = "Authenticated user could not be determined."
                });
            }

            Project? project = null;

            if (request.ProjectId.HasValue)
            {
                project = await _context.Projects
                    .FirstOrDefaultAsync(p => p.Id == request.ProjectId.Value);

                if (project == null)
                {
                    return BadRequest(new
                    {
                        message = "The specified project does not exist."
                    });
                }

                if (!AccessControlService.IsManagementUser(User) &&
                    !await _access.CanAccessProjectAsync(User, project.Id))
                {
                    return Forbid();
                }
            }

            var creatorId = AccessControlService.IsManagementUser(User) && request.CreatedById > 0
                ? request.CreatedById
                : currentUserId.Value;

            if (creatorId <= 0)
            {
                creatorId = currentUserId.Value;
            }

            var creator = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == creatorId && u.IsActive);

            if (creator == null)
            {
                return BadRequest(new
                {
                    message = "The specified creator does not exist or is inactive."
                });
            }

            var allowedStatuses = new[]
            {
                "Todo",
                "InProgress",
                "Pending",
                "Finished",
                "Cancelled"
            };

            if (!allowedStatuses.Contains(request.Status))
            {
                return BadRequest(new
                {
                    message = "Invalid task status."
                });
            }

            var task = new TaskItem
            {
                Title = request.Title.Trim(),
                Description = request.Description?.Trim(),
                Status = request.Status.Trim(),
                Priority = request.Priority.Trim(),
                ProjectId = request.ProjectId,
                CreatedById = creator.Id,
                DueDate = request.DueDate,
                CreatedAt = DateTime.UtcNow
            };

            _context.TaskItems.Add(task);
            await _context.SaveChangesAsync();

            // Users keep their own newly-created task assigned to themselves.
            // Admin-created project tasks remain unassigned until the Admin chooses a team member.
            if (!AccessControlService.IsManagementUser(User))
            {
                _context.TaskAssignees.Add(new TaskAssignee
                {
                    TaskItemId = task.Id,
                    UserId = creator.Id,
                    AssignedAt = DateTime.UtcNow
                });
            }

            LogTaskActivity(
                task,
                "Task created",
                project == null
                    ? $"Created standalone task '{task.Title}'."
                    : $"Created task '{task.Title}' in project '{project.Name}'.");

            await _context.SaveChangesAsync();

            var response = new TaskResponse
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Status = task.Status,
                Priority = task.Priority,
                ProjectId = task.ProjectId,
                ProjectName = project?.Name,
                CreatedById = task.CreatedById,
                CreatedByName = creator.FullName,
                DueDate = task.DueDate,
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt
            };

            return CreatedAtAction(
                nameof(GetTask),
                new { id = task.Id },
                response);
        }

        // =========================================================
        // PUT: api/Tasks/5
        // Update task
        // =========================================================

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> UpdateTask(
            int id,
            UpdateTaskRequest request)
        {
            var task = await _context.TaskItems
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            if (!AccessControlService.IsManagementUser(User) &&
                !await _access.CanAccessTaskAsync(User, id))
            {
                return Forbid();
            }

            // -----------------------------------------------------
            // Check optional Project
            // -----------------------------------------------------

            if (request.ProjectId.HasValue)
            {
                var projectExists = await _context.Projects
                    .AnyAsync(p => p.Id == request.ProjectId.Value);

                if (!projectExists)
                {
                    return BadRequest(new
                    {
                        message = "The specified project does not exist."
                    });
                }
            }

            // -----------------------------------------------------
            // Check Creator
            // -----------------------------------------------------

            var creatorExists = await _context.Users
                .AnyAsync(u => u.Id == request.CreatedById);

            if (!creatorExists)
            {
                return BadRequest(new
                {
                    message = "The specified creator does not exist."
                });
            }

            var allowedStatuses = new[]
            {
                "Todo",
                "InProgress",
                "Pending",
                "Finished",
                "Cancelled"
            };

            if (!allowedStatuses.Contains(request.Status))
            {
                return BadRequest(new
                {
                    message = "Invalid task status."
                });
            }

            // -----------------------------------------------------
            // Update
            // -----------------------------------------------------

            task.Title = request.Title.Trim();

            task.Description = request.Description?.Trim();

            task.Status = request.Status.Trim();

            task.Priority = request.Priority.Trim();

            task.ProjectId = request.ProjectId;

            if (AccessControlService.IsManagementUser(User))
            {
                task.CreatedById = request.CreatedById;
            }

            task.DueDate = request.DueDate;

            task.UpdatedAt = DateTime.UtcNow;

            LogTaskActivity(
                task,
                "Task updated",
                $"Updated task '{task.Title}'.");

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Task updated successfully."
            });
        }

        // =========================================================
        // DELETE: api/Tasks/5
        // Delete task
        // =========================================================

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _context.TaskItems
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            LogTaskActivity(
                task,
                "Task deleted",
                $"Deleted task '{task.Title}'.");

            _context.TaskItems.Remove(task);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Task deleted successfully."
            });
        }

        // =========================================================
        // POST: api/Tasks/{taskId}/assignees/{userId}
        // Assign a user to a task
        // =========================================================

        [HttpPost("{taskId:int}/assignees/{userId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignUserToTask(
            int taskId,
            int userId)
        {
            var task = await _context.TaskItems
                .AsNoTracking()
                .Include(t => t.Project)
                .FirstOrDefaultAsync(t => t.Id == taskId);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            var assignedUser = await _context.Users
                .AsNoTracking()
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            if (assignedUser == null)
                return NotFound(new { message = "User not found or inactive." });

            if (!assignedUser.UserRoles.Any(ur =>
                    ur.Role.Name == "User" || ur.Role.Name == "Developer"))
                return BadRequest(new { message = "Tasks can only be assigned to User accounts." });

            if (task.Project?.TeamId != null)
            {
                var isTeamMember = await _context.TeamMembers.AnyAsync(tm =>
                    tm.TeamId == task.Project.TeamId.Value &&
                    tm.UserId == userId);

                if (!isTeamMember)
                    return BadRequest(new { message = "This user is not a member of the project's assigned team." });
            }

            // Check if the user is already assigned
            var alreadyAssigned = await _context.TaskAssignees
                .AnyAsync(a =>
                    a.TaskItemId == taskId &&
                    a.UserId == userId);

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

            var actorUserId = AccessControlService.GetUserId(User);
            if (actorUserId != userId)
            {
                _notifications.Add(
                    userId,
                    "New task assignment",
                    task.Project != null
                        ? $"You were assigned to '{task.Title}' in project '{task.Project.Name}'."
                        : $"You were assigned to standalone task '{task.Title}'.",
                    "Task");
            }

            LogTaskActivity(
                task,
                "Task assigned",
                $"Assigned {assignedUser.FullName} to '{task.Title}'.");

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User assigned to task successfully.",
                taskId,
                userId
            });
        }


        // =========================================================
        // GET: api/Tasks/{taskId}/assignees
        // Get all users assigned to a task
        // =========================================================

        [HttpGet("{taskId:int}/assignees")]
        public async Task<ActionResult<IEnumerable<TaskAssigneeResponse>>>
            GetTaskAssignees(int taskId)
        {
            // Check if task exists
            var taskExists = await _context.TaskItems
                .AnyAsync(t => t.Id == taskId);

            if (!taskExists)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            if (!await _access.CanAccessTaskAsync(User, taskId))
            {
                return Forbid();
            }

            var assignees = await _context.TaskAssignees
                .AsNoTracking()
                .Where(a => a.TaskItemId == taskId)
                .Include(a => a.User)
                .OrderBy(a => a.AssignedAt)
                .Select(a => new TaskAssigneeResponse
                {
                    UserId = a.UserId,
                    FullName = a.User.FullName,
                    Email = a.User.Email,
                    ProfileImage = a.User.ProfileImage,
                    AssignedAt = a.AssignedAt
                })
                .ToListAsync();

            return Ok(assignees);
        }


        // =========================================================
        // DELETE: api/Tasks/{taskId}/assignees/{userId}
        // Remove a user from a task
        // =========================================================

        [HttpDelete("{taskId:int}/assignees/{userId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveUserFromTask(
            int taskId,
            int userId)
        {
            var assignment = await _context.TaskAssignees
                .FirstOrDefaultAsync(a =>
                    a.TaskItemId == taskId &&
                    a.UserId == userId);

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

        // =========================================================
        // PATCH: api/Tasks/{id}/status
        // Update task status
        // =========================================================

        [HttpPatch("{id:int}/status")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> UpdateTaskStatus(
            int id,
            [FromQuery] string status)
        {
            if (string.IsNullOrWhiteSpace(status))
            {
                return BadRequest(new
                {
                    message = "Status is required."
                });
            }

            var allowedStatuses = new[]
            {
                "Todo",
                "InProgress",
                "Pending",
                "Finished",
                "Cancelled"
            };

            if (!allowedStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message = "Invalid task status."
                });
            }

            var task = await _context.TaskItems
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                return NotFound(new { message = "Task not found." });
            }

            if (!await _access.CanAccessTaskAsync(User, id)) return Forbid();

            task.Status = status.Trim();
            task.UpdatedAt = DateTime.UtcNow;

            LogTaskActivity(
                task,
                "Task status changed",
                $"Moved '{task.Title}' to {task.Status}.");

            var statusActorId = AccessControlService.GetUserId(User);
            if (statusActorId.HasValue && task.CreatedById != statusActorId.Value)
            {
                _notifications.Add(task.CreatedById, "Task updated",
                    $"'{task.Title}' moved to {task.Status}.", "Task");
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Task status updated successfully.",
                taskId = id,
                status = task.Status
            });
        }


        // =========================================================
        // PATCH: api/Tasks/{id}/progress
        // Assigned users can update only their own task progress.
        // A note is required when the task is moved to Pending.
        // =========================================================

        [HttpPatch("{id:int}/progress")]
        [Authorize(Roles = "Admin,User")]
        public async Task<IActionResult> UpdateTaskProgress(
            int id,
            UpdateTaskProgressRequest request)
        {
            var allowedStatuses = new[]
            {
                "Todo",
                "InProgress",
                "Pending",
                "Finished"
            };

            var status = request.Status?.Trim();

            if (string.IsNullOrWhiteSpace(status) ||
                !allowedStatuses.Contains(status))
            {
                return BadRequest(new
                {
                    message = "Status must be Todo, InProgress, Pending, or Finished."
                });
            }

            var note = request.Note?.Trim();

            if (status == "Pending" && string.IsNullOrWhiteSpace(note))
            {
                return BadRequest(new
                {
                    message = "A note explaining the blocker or delay is required when status is Pending."
                });
            }

            var task = await _context.TaskItems
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            if (!await _access.CanAccessTaskAsync(User, id))
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

            task.Status = status;
            task.UpdatedAt = DateTime.UtcNow;

            LogTaskActivity(
                task,
                "Task progress updated",
                $"Updated '{task.Title}' to {task.Status}." +
                (string.IsNullOrWhiteSpace(note) ? string.Empty : $" Note: {note}"));

            if (!string.IsNullOrWhiteSpace(note))
            {
                _context.Comments.Add(new Comment
                {
                    TaskItemId = id,
                    UserId = userId.Value,
                    Content = note,
                    CreatedAt = DateTime.UtcNow
                });
            }

            if (task.CreatedById != userId.Value)
            {
                _notifications.Add(task.CreatedById, "Task updated",
                    $"'{task.Title}' moved to {task.Status}." +
                    (string.IsNullOrWhiteSpace(note) ? string.Empty : $" Note: {note}"), "Task");
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Task progress updated successfully.",
                taskId = id,
                status = task.Status,
                noteAdded = !string.IsNullOrWhiteSpace(note)
            });
        }

        // =========================================================
        // PATCH: api/Tasks/{id}/priority
        // Update task priority
        // =========================================================

        [HttpPatch("{id:int}/priority")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateTaskPriority(
            int id,
            [FromQuery] string priority)
        {
            if (string.IsNullOrWhiteSpace(priority))
            {
                return BadRequest(new
                {
                    message = "Priority is required."
                });
            }

            var allowedPriorities = new[]
            {
                "Low",
                "Medium",
                "High",
                "Urgent"
            };

            if (!allowedPriorities.Contains(priority))
            {
                return BadRequest(new
                {
                    message = "Invalid task priority."
                });
            }

            var task = await _context.TaskItems
                .FirstOrDefaultAsync(t => t.Id == id);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            task.Priority = priority.Trim();
            task.UpdatedAt = DateTime.UtcNow;

            LogTaskActivity(
                task,
                "Task priority changed",
                $"Changed '{task.Title}' priority to {task.Priority}.");

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Task priority updated successfully.",
                taskId = id,
                priority = task.Priority
            });
        }

    }
}