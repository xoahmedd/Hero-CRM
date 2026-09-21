using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using Application.Common;
using Application.DTOs.Common;
using Application.DTOs.Projects;
using Application.Repos_Interfaces;
using Application.Services_Interfaces;
using AutoMapper;
using Domain.Entities.Identity;
using Domain.Entities.Projects;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.EntityFrameworkCore;
using Infrastructure._Data;

namespace Hero_CRM.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IGenericRepository<Project> _projectRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public ProjectsController(
            IGenericRepository<Project> projectRepo,
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService,
            ApplicationDbContext context,
            IMapper mapper)
        {
            _projectRepo = projectRepo;
            _userManager = userManager;
            _notificationService = notificationService;
            _context = context;
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

        private async Task<ProjectResponse> MapToResponseAsync(Project project)
        {
            var response = _mapper.Map<ProjectResponse>(project);

            var owner = await _userManager.FindByIdAsync(project.OwnerId.ToString());
            response.OwnerName = owner?.FullName;

            var members = await _context.ProjectMembers
                .AsNoTracking()
                .Where(pm => pm.ProjectId == project.Id)
                .OrderBy(pm => pm.JoinedAt)
                .ToListAsync();

            foreach (var pm in members)
            {
                var user = await _userManager.FindByIdAsync(pm.UserId.ToString());
                response.Members.Add(new ProjectMemberResponse
                {
                    ProjectId = pm.ProjectId,
                    UserId = pm.UserId,
                    FullName = user?.FullName ?? string.Empty,
                    Email = user?.Email ?? string.Empty,
                    ProfileImage = user?.ProfileImage,
                    JoinedAt = pm.JoinedAt
                });
            }

            // Calculate completion percentage: completed tasks / total tasks (assigned, review, completed), ignoring cancelled
            var allTasks = await _context.TaskItems
                .AsNoTracking()
                .Where(t => t.ProjectId == project.Id)
                .Select(t => t.Status)
                .ToListAsync();

            var nonCancelledTasks = allTasks.Where(s => s != TaskItemStatus.Cancelled).ToList();
            var totalTasks = nonCancelledTasks.Count;
            var completedTasks = nonCancelledTasks.Count(s => s == TaskItemStatus.Completed);
            response.Progress = totalTasks > 0 ? (int)Math.Round((double)completedTasks / totalTasks * 100) : 0;

            // Auto-sync project status if tasks exist and project is not cancelled
            if (allTasks.Count > 0 && project.Status != ProjectStatus.Cancelled)
            {
                bool hasCompleted = allTasks.Any(s => s == TaskItemStatus.Completed);
                bool allTasksCompletedOrCancelled = allTasks.All(s => s == TaskItemStatus.Completed || s == TaskItemStatus.Cancelled);
                bool isAutoFinished = hasCompleted && allTasksCompletedOrCancelled;

                if (isAutoFinished && project.Status != ProjectStatus.Finished)
                {
                    project.Status = ProjectStatus.Finished;
                    project.CompletedAt = DateTime.UtcNow;
                    response.Status = ProjectStatus.Finished;
                    response.CompletedAt = project.CompletedAt;
                    var dbProj = await _context.Projects.FindAsync(project.Id);
                    if (dbProj != null && dbProj.Status != ProjectStatus.Finished)
                    {
                        dbProj.Status = ProjectStatus.Finished;
                        dbProj.CompletedAt = project.CompletedAt;
                        dbProj.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }
                else if (!isAutoFinished && project.Status == ProjectStatus.Finished)
                {
                    project.Status = ProjectStatus.InProgress;
                    project.CompletedAt = null;
                    response.Status = ProjectStatus.InProgress;
                    response.CompletedAt = null;
                    var dbProj = await _context.Projects.FindAsync(project.Id);
                    if (dbProj != null && dbProj.Status == ProjectStatus.Finished)
                    {
                        dbProj.Status = ProjectStatus.InProgress;
                        dbProj.CompletedAt = null;
                        dbProj.UpdatedAt = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }
                }
            }

            if (response.Status == ProjectStatus.Finished && !response.CompletedAt.HasValue)
            {
                response.CompletedAt = project.CompletedAt ?? project.UpdatedAt ?? project.DueDate ?? project.CreatedAt;
            }

            return response;
        }

        // GET: api/Projects
        [HttpGet]
        public async Task<IActionResult> GetProjects(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] string? search = null,
            [FromQuery] ProjectStatus? status = null)
        {
            var query = _projectRepo.GetQueryable();

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                query = query.Where(p =>
                    p.OwnerId == userId ||
                    p.Members.Any(m => m.UserId == userId) ||
                    p.Tasks.Any(t => t.Assignees.Any(ta => ta.UserId == userId)));
            }

            if (pageIndex.HasValue || pageSize.HasValue || !string.IsNullOrWhiteSpace(search) || status.HasValue)
            {
                var s = search?.Trim();

                if (!string.IsNullOrWhiteSpace(s))
                {
                    query = query.Where(p =>
                        p.Name.Contains(s) ||
                        (p.Description != null && p.Description.Contains(s)));
                }

                if (status.HasValue)
                {
                    query = query.Where(p => p.Status == status.Value);
                }

                var totalCount = await query.CountAsync();

                IOrderedQueryable<Project> orderedPagedQuery;
                if (status.HasValue && status.Value == ProjectStatus.InProgress)
                {
                    orderedPagedQuery = query
                        .OrderBy(p => p.DueDate == null)
                        .ThenBy(p => p.DueDate)
                        .ThenByDescending(p => p.CreatedAt);
                }
                else
                {
                    orderedPagedQuery = query
                        .OrderByDescending(p => p.CreatedAt);
                }

                var pagedProjects = await orderedPagedQuery
                    .Skip(((pageIndex ?? 1) - 1) * (pageSize ?? 20))
                    .Take(pageSize ?? 20)
                    .ToListAsync();

                var responses = new List<ProjectResponse>();
                foreach (var p in pagedProjects)
                {
                    responses.Add(await MapToResponseAsync(p));
                }

                return Ok(new Pagination<ProjectResponse>(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    totalCount,
                    responses));
            }

            IOrderedQueryable<Project> orderedProjects;
            if (status.HasValue && status.Value == ProjectStatus.InProgress)
            {
                orderedProjects = query
                    .OrderBy(p => p.DueDate == null)
                    .ThenBy(p => p.DueDate)
                    .ThenByDescending(p => p.CreatedAt);
            }
            else
            {
                orderedProjects = query
                    .OrderByDescending(p => p.CreatedAt);
            }

            var projects = await orderedProjects.ToListAsync();

            var list = new List<ProjectResponse>();
            foreach (var p in projects)
            {
                list.Add(await MapToResponseAsync(p));
            }

            return Ok(list);
        }

        // GET: api/Projects/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProjectResponse>> GetProject(int id)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                var isAssigned = await _projectRepo.GetQueryable()
                    .Where(p => p.Id == id && (
                        p.OwnerId == userId ||
                        p.Members.Any(m => m.UserId == userId) ||
                        p.Tasks.Any(t => t.Assignees.Any(ta => ta.UserId == userId))))
                    .AnyAsync();

                if (!isAssigned)
                {
                    return Forbid();
                }
            }

            var response = await MapToResponseAsync(project);
            return Ok(response);
        }



        // GET: api/Projects/owner/1
        [HttpGet("owner/{ownerId:int}")]
        public async Task<IActionResult> GetProjectsByOwner(
            int ownerId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (!IsAdmin && ownerId != CurrentUserId)
            {
                return Forbid();
            }

            var owner = await _userManager.FindByIdAsync(ownerId.ToString());

            if (owner == null)
            {
                return NotFound(new
                {
                    message = "Owner user not found."
                });
            }

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedProjects = await _projectRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: p => p.OwnerId == ownerId,
                    orderBy: q => q.OrderBy(p => p.DueDate == null).ThenBy(p => p.DueDate).ThenByDescending(p => p.CreatedAt));

                var responses = new List<ProjectResponse>();
                foreach (var p in pagedProjects.Data)
                {
                    var resp = await MapToResponseAsync(p);
                    resp.OwnerName = owner.FullName;
                    responses.Add(resp);
                }

                return Ok(new Pagination<ProjectResponse>(
                    pagedProjects.PageIndex,
                    pagedProjects.PageSize,
                    pagedProjects.Count,
                    responses));
            }

            var ownerProjects = await _projectRepo.GetQueryable()
                .Where(p => p.OwnerId == ownerId)
                .OrderBy(p => p.DueDate == null)
                .ThenBy(p => p.DueDate)
                .ThenByDescending(p => p.CreatedAt)
                .ToListAsync();

            var list = new List<ProjectResponse>();
            foreach (var p in ownerProjects)
            {
                var resp = await MapToResponseAsync(p);
                resp.OwnerName = owner.FullName;
                list.Add(resp);
            }

            return Ok(list);
        }



        // POST: api/Projects
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<ProjectResponse>> CreateProject([FromBody] CreateProjectRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var memberIds = (request.MemberIds ?? new List<int>()).Distinct().ToList();

            int resolvedOwnerId = (request.OwnerId.HasValue && request.OwnerId.Value > 0)
                ? request.OwnerId.Value
                : (memberIds.Any() ? memberIds.First() : CurrentUserId);

            var owner = await _userManager.FindByIdAsync(resolvedOwnerId.ToString());
            if (owner == null)
            {
                var admin = await _userManager.FindByIdAsync(CurrentUserId.ToString());
                if (admin != null)
                {
                    resolvedOwnerId = CurrentUserId;
                }
                else
                {
                    return BadRequest(new { message = "Valid owner user not found." });
                }
            }

            var project = _mapper.Map<Project>(request);
            project.OwnerId = resolvedOwnerId;
            project.CreatedAt = DateTime.UtcNow;
            if (project.Status == ProjectStatus.Finished)
            {
                project.CompletedAt = DateTime.UtcNow;
            }

            await _projectRepo.AddAsync(project);
            await _projectRepo.SaveChangesAsync();

            // Add all assigned members and owner to ProjectMembers and notify
            var allDevIdsToNotify = new HashSet<int>(memberIds);
            if (project.OwnerId > 0 && project.OwnerId != CurrentUserId)
            {
                allDevIdsToNotify.Add(project.OwnerId);
            }

            foreach (var devId in allDevIdsToNotify)
            {
                var dev = await _userManager.FindByIdAsync(devId.ToString());
                if (dev != null)
                {
                    var exists = await _context.ProjectMembers.AnyAsync(pm => pm.ProjectId == project.Id && pm.UserId == devId);
                    if (!exists)
                    {
                        _context.ProjectMembers.Add(new ProjectMember
                        {
                            ProjectId = project.Id,
                            UserId = devId,
                            JoinedAt = DateTime.UtcNow
                        });
                    }

                    // Notify assigned developer
                    await _notificationService.NotifyProjectAssignmentAsync(devId, project.Id, project.Name);
                }
            }

            if (allDevIdsToNotify.Any())
            {
                await _context.SaveChangesAsync();
            }

            var response = await MapToResponseAsync(project);

            return CreatedAtAction(
                nameof(GetProject),
                new { id = project.Id },
                response);
        }

        // PUT: api/Projects/5/missed-reason
        [HttpPut("{id:int}/missed-reason")]
        public async Task<IActionResult> SubmitMissedDeadlineReason(int id, [FromBody] SubmitMissedReasonDto dto)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                var isAssigned = await _projectRepo.GetQueryable()
                    .Where(p => p.Id == id && (
                        p.OwnerId == userId ||
                        p.Members.Any(m => m.UserId == userId) ||
                        p.Tasks.Any(t => t.Assignees.Any(ta => ta.UserId == userId))))
                    .AnyAsync();

                if (!isAssigned)
                {
                    return Forbid();
                }
            }

            project.MissedDeadlineReason = dto.Reason;
            project.ReasonCategory = null;
            project.UpdatedAt = DateTime.UtcNow;

            _projectRepo.Update(project);
            await _projectRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Missed deadline reason submitted successfully.",
                projectId = project.Id,
                reasonCategory = project.ReasonCategory,
                missedDeadlineReason = project.MissedDeadlineReason
            });
        }



        // GET: api/Projects/overdue
        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdueProjects()
        {
            var now = DateTime.UtcNow;
            var query = _projectRepo.GetQueryable()
                .Where(p => p.DueDate.HasValue && p.DueDate < now && p.Status != ProjectStatus.Finished && p.Status != ProjectStatus.Cancelled);

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                query = query.Where(p =>
                    p.OwnerId == userId ||
                    p.Members.Any(m => m.UserId == userId) ||
                    p.Tasks.Any(t => t.Assignees.Any(ta => ta.UserId == userId)));
            }

            var overdueProjects = await query
                .OrderByDescending(p => p.DueDate)
                .ToListAsync();

            var result = new List<ProjectResponse>();
            foreach (var p in overdueProjects)
            {
                result.Add(await MapToResponseAsync(p));
            }

            return Ok(result);
        }


        // PUT: api/Projects/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateProject(int id, UpdateProjectRequest request)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (!IsAdmin)
            {
                return Forbid();
            }

            if (request.OwnerId.HasValue && request.OwnerId.Value > 0)
            {
                var owner = await _userManager.FindByIdAsync(request.OwnerId.Value.ToString());
                if (owner == null)
                {
                    return BadRequest(new { message = "The specified owner user does not exist." });
                }
            }

            if (request.DueDate.HasValue &&
                request.StartDate.HasValue &&
                request.DueDate < request.StartDate)
            {
                return BadRequest(new { message = "Due date cannot be earlier than start date." });
            }

            var previousOwnerId = project.OwnerId;

            _mapper.Map(request, project);
            if (project.Status == ProjectStatus.Finished && !project.CompletedAt.HasValue)
            {
                project.CompletedAt = DateTime.UtcNow;
            }
            else if (project.Status != ProjectStatus.Finished)
            {
                project.CompletedAt = null;
            }

            if (!string.IsNullOrEmpty(request.ReasonCategory))
            {
                project.ReasonCategory = request.ReasonCategory;
            }
            if (request.OwnerId.HasValue && request.OwnerId.Value > 0)
            {
                project.OwnerId = request.OwnerId.Value;
            }
            project.UpdatedAt = DateTime.UtcNow;

            _projectRepo.Update(project);
            await _projectRepo.SaveChangesAsync();

            if (previousOwnerId != project.OwnerId)
            {
                await _notificationService.NotifyProjectAssignmentAsync(project.OwnerId, project.Id, project.Name);
            }

            // Sync ProjectMembers if MemberIds is provided
            if (request.MemberIds != null)
            {
                var existingMembers = await _context.ProjectMembers
                    .Where(pm => pm.ProjectId == id)
                    .ToListAsync();

                var targetIds = request.MemberIds.Distinct().ToHashSet();

                var toRemove = existingMembers.Where(pm => !targetIds.Contains(pm.UserId)).ToList();
                if (toRemove.Any())
                {
                    _context.ProjectMembers.RemoveRange(toRemove);
                }

                var existingIds = existingMembers.Select(pm => pm.UserId).ToHashSet();
                var toAdd = targetIds.Where(uid => !existingIds.Contains(uid)).ToList();
                foreach (var newUserId in toAdd)
                {
                    var user = await _userManager.FindByIdAsync(newUserId.ToString());
                    if (user != null)
                    {
                        _context.ProjectMembers.Add(new ProjectMember
                        {
                            ProjectId = id,
                            UserId = newUserId,
                            JoinedAt = DateTime.UtcNow
                        });
                        await _notificationService.NotifyProjectAssignmentAsync(newUserId, project.Id, project.Name);
                    }
                }

                await _context.SaveChangesAsync();
            }

            if (project.Status == ProjectStatus.Cancelled)
            {
                var tasksToCancel = await _context.TaskItems
                    .Where(t => t.ProjectId == id && t.Status != TaskItemStatus.Cancelled && t.Status != TaskItemStatus.Completed)
                    .ToListAsync();

                foreach (var t in tasksToCancel)
                {
                    t.Status = TaskItemStatus.Cancelled;
                    t.UpdatedAt = DateTime.UtcNow;
                }
                if (tasksToCancel.Any())
                {
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new
            {
                message = "Project updated successfully."
            });
        }

        // PATCH: api/Projects/5/status
        [Authorize(Roles = "Admin")]
        [HttpPatch("{id:int}/status")]
        public async Task<IActionResult> UpdateProjectStatus(
            int id,
            [FromQuery] string? status = null,
            [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] UpdateProjectStatusDto? dto = null)
        {
            ProjectStatus? targetStatus = dto?.Status;
            if (!targetStatus.HasValue && !string.IsNullOrWhiteSpace(status))
            {
                var s = status.Trim().Replace(" ", "").Replace("_", "").Replace("-", "");
                if (Enum.TryParse<ProjectStatus>(s, true, out var parsed))
                {
                    targetStatus = parsed;
                }
                else if (s.Equals("Working", StringComparison.OrdinalIgnoreCase) || s.Equals("Planning", StringComparison.OrdinalIgnoreCase) || s.Equals("Submitted", StringComparison.OrdinalIgnoreCase))
                {
                    targetStatus = ProjectStatus.InProgress;
                }
                else if (s.Equals("Canceled", StringComparison.OrdinalIgnoreCase) || s.Equals("Rejected", StringComparison.OrdinalIgnoreCase))
                {
                    targetStatus = ProjectStatus.Cancelled;
                }
            }

            if (!targetStatus.HasValue)
            {
                return BadRequest(new
                {
                    message = "Status is required ('InProgress', 'Finished', or 'Cancelled')."
                });
            }

            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (!IsAdmin)
            {
                return Forbid();
            }

            project.Status = targetStatus.Value;
            project.UpdatedAt = DateTime.UtcNow;

            _projectRepo.Update(project);
            await _projectRepo.SaveChangesAsync();

            if (project.Status == ProjectStatus.Cancelled)
            {
                var tasksToCancel = await _context.TaskItems
                    .Where(t => t.ProjectId == id && t.Status != TaskItemStatus.Cancelled && t.Status != TaskItemStatus.Completed)
                    .ToListAsync();

                foreach (var t in tasksToCancel)
                {
                    t.Status = TaskItemStatus.Cancelled;
                    t.UpdatedAt = DateTime.UtcNow;
                }
                if (tasksToCancel.Any())
                {
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new
            {
                message = "Project status updated successfully.",
                projectId = id,
                status = project.Status
            });
        }

        // DELETE: api/Projects/5
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (!IsAdmin)
            {
                return Forbid();
            }

            var projectTaskIds = await _context.TaskItems
                .Where(t => t.ProjectId == id)
                .Select(t => t.Id)
                .ToListAsync();

            var notifs = await _context.Notifications
                .Where(n => n.ProjectId == id || (n.TaskId.HasValue && projectTaskIds.Contains(n.TaskId.Value)))
                .ToListAsync();
            if (notifs.Any())
            {
                _context.Notifications.RemoveRange(notifs);
                await _context.SaveChangesAsync();
            }

            _projectRepo.Delete(project);
            await _projectRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Project deleted successfully."
            });
        }
    }
}
