using Application.DTOs.Dashboard;
using Application.DTOs.Projects;
using Application.DTOs.Tasks.TaskItem;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Collaborations;
using Domain.Entities.Customers;
using Domain.Entities.Identity;
using Domain.Entities.Projects;
using Domain.Entities.Tasks;
using Domain.Enums;
using Infrastructure._Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IGenericRepository<Customer> _customerRepo;
        private readonly IGenericRepository<Project> _projectRepo;
        private readonly IGenericRepository<TaskItem> _taskRepo;
        private readonly IGenericRepository<Notification> _notificationRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public DashboardController(
            IGenericRepository<Customer> customerRepo,
            IGenericRepository<Project> projectRepo,
            IGenericRepository<TaskItem> taskRepo,
            IGenericRepository<Notification> notificationRepo,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context,
            IMapper mapper)
        {
            _customerRepo = customerRepo;
            _projectRepo = projectRepo;
            _taskRepo = taskRepo;
            _notificationRepo = notificationRepo;
            _userManager = userManager;
            _context = context;
            _mapper = mapper;
        }

        // GET: api/Dashboard
        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var totalCustomers = await _customerRepo.GetQueryable().CountAsync();

            var projectsQuery = _projectRepo.GetQueryable();
            var totalProjects = await projectsQuery.CountAsync();
            var activeProjects = await projectsQuery.CountAsync(p => p.Status == ProjectStatus.Working);

            var tasksQuery = _taskRepo.GetQueryable();
            var totalTasks = await tasksQuery.CountAsync();
            var completedTasks = await tasksQuery.CountAsync(t => t.Status == TaskItemStatus.Completed);
            var pendingTasks = await tasksQuery.CountAsync(t => t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled);

            var now = DateTime.UtcNow;
            var overdueTasks = await tasksQuery.CountAsync(t =>
                t.DueDate.HasValue &&
                t.DueDate < now &&
                t.Status != TaskItemStatus.Completed &&
                t.Status != TaskItemStatus.Cancelled);

            var totalUsers = await _userManager.Users.CountAsync(u => u.IsActive);

            return Ok(new
            {
                totalCustomers,
                totalProjects,
                activeProjects,
                totalTasks,
                completedTasks,
                pendingTasks,
                overdueTasks,
                totalUsers
            });
        }

        // GET: api/Dashboard/admin
        [HttpGet("admin")]
        public async Task<ActionResult<AdminDashboardResponse>> GetAdminDashboard()
        {
            var now = DateTime.UtcNow;
            var projects = await _projectRepo.GetQueryable().ToListAsync();
            var tasks = await _taskRepo.GetQueryable().ToListAsync();
            var users = await _userManager.Users.Where(u => u.IsActive).ToListAsync();

            var pendingProjects = projects.Count(p => p.Status == ProjectStatus.Submitted || p.Status == ProjectStatus.Planning);
            var workingProjects = projects.Count(p => p.Status == ProjectStatus.Working);
            var finishedProjects = projects.Count(p => p.Status == ProjectStatus.Finished);
            var overdueProjects = projects.Count(p => (p.DueDate.HasValue && p.DueDate < now && p.Status != ProjectStatus.Finished) || p.Status == ProjectStatus.Overdue);

            var completedTasks = tasks.Count(t => t.Status == TaskItemStatus.Completed);
            var pendingTasks = tasks.Count(t => t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled);
            var overdueTasks = tasks.Count(t => t.DueDate.HasValue && t.DueDate < now && t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled);

            // Department Requests Distribution
            var deptRequests = projects
                .Where(p => !string.IsNullOrWhiteSpace(p.RequestingDepartment))
                .GroupBy(p => p.RequestingDepartment!.Trim(), StringComparer.OrdinalIgnoreCase)
                .Select(g => new DepartmentRequestSummary
                {
                    DepartmentName = g.Key,
                    ProjectCount = g.Count()
                })
                .OrderByDescending(d => d.ProjectCount)
                .ToList();

            // Developer Workloads
            var developerWorkloads = new List<DeveloperWorkloadSummary>();
            foreach (var user in users)
            {
                var activeProjCount = projects.Count(p => p.OwnerId == user.Id && p.Status == ProjectStatus.Working);
                var assignedTaskIds = await _context.TaskAssignees.Where(ta => ta.UserId == user.Id).Select(ta => ta.TaskItemId).ToListAsync();
                var activeTaskCount = tasks.Count(t => assignedTaskIds.Contains(t.Id) && t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled);

                developerWorkloads.Add(new DeveloperWorkloadSummary
                {
                    DeveloperId = user.Id,
                    DeveloperName = user.FullName,
                    ActiveProjectsCount = activeProjCount,
                    ActiveTasksCount = activeTaskCount
                });
            }

            // Overdue Items Needing Reason
            var overdueItems = new List<OverdueItemSummary>();
            foreach (var p in projects.Where(p => (p.DueDate.HasValue && p.DueDate < now && p.Status != ProjectStatus.Finished) || p.Status == ProjectStatus.Overdue))
            {
                var owner = users.FirstOrDefault(u => u.Id == p.OwnerId);
                overdueItems.Add(new OverdueItemSummary
                {
                    ItemType = "Project",
                    Id = p.Id,
                    Title = p.Name,
                    DueDate = p.DueDate,
                    AssignedUserId = p.OwnerId,
                    AssignedUserName = owner?.FullName,
                    RequestingDepartment = p.RequestingDepartment,
                    MissedDeadlineReason = p.MissedDeadlineReason,
                    ReasonCategory = p.ReasonCategory
                });
            }

            foreach (var t in tasks.Where(t => t.DueDate.HasValue && t.DueDate < now && t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled))
            {
                var assigneeIds = await _context.TaskAssignees.Where(ta => ta.TaskItemId == t.Id).Select(ta => ta.UserId).ToListAsync();
                var firstAssignee = users.FirstOrDefault(u => assigneeIds.Contains(u.Id));
                overdueItems.Add(new OverdueItemSummary
                {
                    ItemType = "Task",
                    Id = t.Id,
                    Title = t.Title,
                    DueDate = t.DueDate,
                    AssignedUserId = firstAssignee?.Id,
                    AssignedUserName = firstAssignee?.FullName,
                    MissedDeadlineReason = t.MissedDeadlineReason,
                    ReasonCategory = t.ReasonCategory
                });
            }

            // Recent Projects
            var recentProjectsList = new List<ProjectResponse>();
            foreach (var p in projects.OrderByDescending(p => p.CreatedAt).Take(5))
            {
                var owner = users.FirstOrDefault(u => u.Id == p.OwnerId);
                var resp = _mapper.Map<ProjectResponse>(p);
                resp.OwnerName = owner?.FullName;
                recentProjectsList.Add(resp);
            }

            var adminDashboard = new AdminDashboardResponse
            {
                TotalProjects = projects.Count,
                PendingProjects = pendingProjects,
                WorkingProjects = workingProjects,
                FinishedProjects = finishedProjects,
                OverdueProjects = overdueProjects,
                TotalTasks = tasks.Count,
                CompletedTasks = completedTasks,
                PendingTasks = pendingTasks,
                OverdueTasks = overdueTasks,
                TotalActiveDevelopers = users.Count,
                DepartmentRequests = deptRequests,
                DeveloperWorkloads = developerWorkloads,
                OverdueItemsNeedingReason = overdueItems,
                RecentProjects = recentProjectsList
            };

            return Ok(adminDashboard);
        }

        // GET: api/Dashboard/developer/5
        [HttpGet("developer/{userId:int}")]
        public async Task<ActionResult<DeveloperDashboardResponse>> GetDeveloperDashboard(int userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return NotFound(new { message = "Developer not found." });
            }

            var now = DateTime.UtcNow;

            // Projects owned by developer or where developer is team member
            var assignedProjects = await _projectRepo.GetQueryable()
                .Where(p => p.OwnerId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var assignedProjectResponses = new List<ProjectResponse>();
            foreach (var p in assignedProjects)
            {
                var resp = _mapper.Map<ProjectResponse>(p);
                resp.OwnerName = user.FullName;
                assignedProjectResponses.Add(resp);
            }

            // Tasks assigned to developer
            var assignedTaskIds = await _context.TaskAssignees
                .Where(ta => ta.UserId == userId)
                .Select(ta => ta.TaskItemId)
                .ToListAsync();

            var userTasks = await _taskRepo.GetQueryable()
                .Where(t => assignedTaskIds.Contains(t.Id))
                .ToListAsync();

            var activeTasksCount = userTasks.Count(t => t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled);
            var completedTasksCount = userTasks.Count(t => t.Status == TaskItemStatus.Completed);
            var overdueTasksCount = userTasks.Count(t => t.DueDate.HasValue && t.DueDate < now && t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled);

            // Upcoming Tasks (due in future)
            var upcomingTasksList = new List<TaskResponse>();
            foreach (var t in userTasks.Where(t => t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled).OrderBy(t => t.DueDate == null).ThenBy(t => t.DueDate).Take(10))
            {
                var proj = await _projectRepo.GetByIdAsync(t.ProjectId);
                var resp = _mapper.Map<TaskResponse>(t);
                resp.ProjectName = proj?.Name;
                resp.CreatedByName = user.FullName;
                upcomingTasksList.Add(resp);
            }

            // Pending Reason Submissions for this developer
            var pendingReasons = new List<OverdueItemSummary>();
            foreach (var p in assignedProjects.Where(p => (p.DueDate.HasValue && p.DueDate < now && p.Status != ProjectStatus.Finished) || p.Status == ProjectStatus.Overdue))
            {
                if (string.IsNullOrWhiteSpace(p.MissedDeadlineReason))
                {
                    pendingReasons.Add(new OverdueItemSummary
                    {
                        ItemType = "Project",
                        Id = p.Id,
                        Title = p.Name,
                        DueDate = p.DueDate,
                        AssignedUserId = userId,
                        AssignedUserName = user.FullName,
                        RequestingDepartment = p.RequestingDepartment,
                        MissedDeadlineReason = p.MissedDeadlineReason
                    });
                }
            }

            foreach (var t in userTasks.Where(t => t.DueDate.HasValue && t.DueDate < now && t.Status != TaskItemStatus.Completed && t.Status != TaskItemStatus.Cancelled))
            {
                if (string.IsNullOrWhiteSpace(t.MissedDeadlineReason))
                {
                    pendingReasons.Add(new OverdueItemSummary
                    {
                        ItemType = "Task",
                        Id = t.Id,
                        Title = t.Title,
                        DueDate = t.DueDate,
                        AssignedUserId = userId,
                        AssignedUserName = user.FullName,
                        MissedDeadlineReason = t.MissedDeadlineReason
                    });
                }
            }

            // Unread Notifications Count
            var unreadCount = await _notificationRepo.GetQueryable()
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            var devDashboard = new DeveloperDashboardResponse
            {
                UserId = userId,
                DeveloperName = user.FullName,
                AssignedProjectsCount = assignedProjects.Count,
                ActiveTasksCount = activeTasksCount,
                CompletedTasksCount = completedTasksCount,
                OverdueTasksCount = overdueTasksCount,
                UnreadNotificationsCount = unreadCount,
                AssignedProjects = assignedProjectResponses,
                UpcomingTasks = upcomingTasksList,
                PendingReasonSubmissions = pendingReasons
            };

            return Ok(devDashboard);
        }

        // GET: api/Dashboard/project/5
        [HttpGet("project/{projectId:int}")]
        public async Task<IActionResult> GetProjectDashboard(int projectId)
        {
            var project = await _projectRepo.GetByIdAsync(projectId);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            var projectTasksQuery = _taskRepo.GetQueryable().Where(t => t.ProjectId == projectId);

            var totalTasks = await projectTasksQuery.CountAsync();
            var completedTasks = await projectTasksQuery.CountAsync(t => t.Status == TaskItemStatus.Completed);
            var inProgressTasks = await projectTasksQuery.CountAsync(t => t.Status == TaskItemStatus.InProgress);
            var todoTasks = await projectTasksQuery.CountAsync(t => t.Status == TaskItemStatus.Todo);

            var completionPercentage = totalTasks == 0
                ? 0
                : Math.Round((double)completedTasks / totalTasks * 100, 2);

            return Ok(new
            {
                projectId,
                projectName = project.Name,
                status = project.Status,
                dueDate = project.DueDate,
                missedDeadlineReason = project.MissedDeadlineReason,
                requestingDepartment = project.RequestingDepartment,
                totalTasks,
                completedTasks,
                inProgressTasks,
                todoTasks,
                completionPercentage
            });
        }
    }
}
