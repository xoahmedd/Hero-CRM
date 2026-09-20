using CRM.API.Data;
using CRM.API.DTOs.Dashboard;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class DashboardController : ControllerBase
    {
        private const string DepartmentType = "Department";
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<DashboardResponse>> GetDashboard()
        {
            var now = DateTime.UtcNow;
            var today = now.Date;
            var tomorrow = today.AddDays(1);

            var totalDepartments = await _context.Customers
                .CountAsync(department => department.Type == DepartmentType);

            var totalPeople = await _context.Contacts
                .CountAsync(person => person.Organization.Type == DepartmentType);

            var totalProjects = await _context.Projects.CountAsync();
            var activeProjects = await _context.Projects.CountAsync(project => project.Status == "Active");
            var totalTasks = await _context.TaskItems.CountAsync();
            var completedTasks = await _context.TaskItems.CountAsync(task => task.Status == "Finished");
            var pendingTasks = await _context.TaskItems.CountAsync(task =>
                task.Status != "Finished" && task.Status != "Cancelled");
            var overdueTasks = await _context.TaskItems.CountAsync(task =>
                task.DueDate.HasValue &&
                task.DueDate < now &&
                task.Status != "Finished" &&
                task.Status != "Cancelled");
            var totalUsers = await _context.Users.CountAsync(user => user.IsActive);

            var openFollowUps = await _context.FollowUps.CountAsync(followUp => followUp.Status == "Open");
            var overdueFollowUps = await _context.FollowUps.CountAsync(followUp =>
                followUp.Status == "Open" && followUp.DueAt < now);
            var dueTodayFollowUps = await _context.FollowUps.CountAsync(followUp =>
                followUp.Status == "Open" &&
                followUp.DueAt >= today &&
                followUp.DueAt < tomorrow);

            var upcomingFollowUps = await _context.FollowUps
                .AsNoTracking()
                .Where(followUp => followUp.Status == "Open" && followUp.DueAt >= now)
                .OrderBy(followUp => followUp.DueAt)
                .Take(5)
                .Select(followUp => new DashboardFollowUpItem
                {
                    Id = followUp.Id,
                    Title = followUp.Title,
                    Type = followUp.Type,
                    DueAt = followUp.DueAt,
                    OwnerName = followUp.Owner.FullName,
                    TargetLabel = followUp.Contact != null
                        ? followUp.Contact.Name
                        : followUp.Department != null
                            ? followUp.Department.Name
                            : followUp.Project != null
                                ? followUp.Project.Name
                                : null
                })
                .ToListAsync();

            var recentActivities = await _context.Activities
                .AsNoTracking()
                .OrderByDescending(activity => activity.CreatedAt)
                .Take(8)
                .Select(activity => new DashboardActivityItem
                {
                    Id = activity.Id,
                    EntityType = activity.EntityType,
                    EntityId = activity.EntityId,
                    Action = activity.Action,
                    Description = activity.Description,
                    UserName = activity.User.FullName,
                    CreatedAt = activity.CreatedAt
                })
                .ToListAsync();

            return Ok(new DashboardResponse
            {
                TotalDepartments = totalDepartments,
                TotalPeople = totalPeople,
                TotalProjects = totalProjects,
                ActiveProjects = activeProjects,
                TotalTasks = totalTasks,
                CompletedTasks = completedTasks,
                PendingTasks = pendingTasks,
                OverdueTasks = overdueTasks,
                TotalUsers = totalUsers,
                OpenFollowUps = openFollowUps,
                OverdueFollowUps = overdueFollowUps,
                DueTodayFollowUps = dueTodayFollowUps,
                TaskCompletionRate = totalTasks == 0
                    ? 0
                    : Math.Round((double)completedTasks / totalTasks * 100, 1),
                UpcomingFollowUps = upcomingFollowUps,
                RecentActivities = recentActivities
            });
        }

        [HttpGet("project/{projectId:int}")]
        public async Task<IActionResult> GetProjectDashboard(int projectId)
        {
            var projectExists = await _context.Projects.AnyAsync(project => project.Id == projectId);
            if (!projectExists)
            {
                return NotFound(new { message = "Project not found." });
            }

            var totalTasks = await _context.TaskItems.CountAsync(task => task.ProjectId == projectId);
            var completedTasks = await _context.TaskItems.CountAsync(task =>
                task.ProjectId == projectId && task.Status == "Finished");
            var inProgressTasks = await _context.TaskItems.CountAsync(task =>
                task.ProjectId == projectId && task.Status == "InProgress");
            var todoTasks = await _context.TaskItems.CountAsync(task =>
                task.ProjectId == projectId && task.Status == "Todo");

            return Ok(new
            {
                projectId,
                totalTasks,
                completedTasks,
                inProgressTasks,
                todoTasks,
                completionPercentage = totalTasks == 0
                    ? 0
                    : Math.Round((double)completedTasks / totalTasks * 100, 2)
            });
        }
    }
}
