using CRM.API.Data;
using CRM.API.DTOs.Report;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ReportsController : ControllerBase
    {
        private const string DepartmentType = "Department";
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("workspace")]
        public async Task<ActionResult<WorkspaceReportResponse>> GetWorkspaceReport(
            [FromQuery] int months = 6)
        {
            if (months < 3 || months > 12)
            {
                return BadRequest(new { message = "Months must be between 3 and 12." });
            }

            var now = DateTime.UtcNow;
            var dueSoonEnd = now.AddDays(7);
            var currentMonth = new DateTime(now.Year, now.Month, 1);
            var rangeStart = currentMonth.AddMonths(-(months - 1));

            var totalDepartments = await _context.Customers.CountAsync(department => department.Type == DepartmentType);
            var totalPeople = await _context.Contacts.CountAsync(person => person.Organization.Type == DepartmentType);
            var totalProjects = await _context.Projects.CountAsync();
            var activeProjects = await _context.Projects.CountAsync(project => project.Status == "Active");
            var totalTasks = await _context.TaskItems.CountAsync();
            var completedTasks = await _context.TaskItems.CountAsync(task => task.Status == "Finished");
            var pendingTasks = await _context.TaskItems.CountAsync(task =>
                task.Status != "Finished" && task.Status != "Cancelled");
            var overdueTasks = await _context.TaskItems.CountAsync(task =>
                task.DueDate.HasValue && task.DueDate < now &&
                task.Status != "Finished" && task.Status != "Cancelled");
            var totalUsers = await _context.Users.CountAsync(user => user.IsActive);
            var openFollowUps = await _context.FollowUps.CountAsync(followUp => followUp.Status == "Open");
            var overdueFollowUps = await _context.FollowUps.CountAsync(followUp =>
                followUp.Status == "Open" && followUp.DueAt < now);

            var taskStatus = await _context.TaskItems
                .AsNoTracking()
                .GroupBy(task => task.Status)
                .Select(group => new ReportBreakdownItem { Name = group.Key, Count = group.Count() })
                .OrderByDescending(item => item.Count)
                .ToListAsync();

            var taskPriority = await _context.TaskItems
                .AsNoTracking()
                .GroupBy(task => task.Priority)
                .Select(group => new ReportBreakdownItem { Name = group.Key, Count = group.Count() })
                .OrderByDescending(item => item.Count)
                .ToListAsync();

            var projectStatus = await _context.Projects
                .AsNoTracking()
                .GroupBy(project => project.Status)
                .Select(group => new ReportBreakdownItem { Name = group.Key, Count = group.Count() })
                .OrderByDescending(item => item.Count)
                .ToListAsync();

            var departmentStatus = await _context.Customers
                .AsNoTracking()
                .Where(department => department.Type == DepartmentType)
                .GroupBy(department => department.Status)
                .Select(group => new ReportBreakdownItem { Name = group.Key, Count = group.Count() })
                .OrderByDescending(item => item.Count)
                .ToListAsync();

            var followUpStatus = await _context.FollowUps
                .AsNoTracking()
                .GroupBy(followUp => followUp.Status)
                .Select(group => new ReportBreakdownItem { Name = group.Key, Count = group.Count() })
                .OrderByDescending(item => item.Count)
                .ToListAsync();

            var taskTrendRows = await _context.TaskItems
                .AsNoTracking()
                .Where(task => task.CreatedAt >= rangeStart)
                .GroupBy(task => new { task.CreatedAt.Year, task.CreatedAt.Month })
                .Select(group => new { group.Key.Year, group.Key.Month, Count = group.Count() })
                .ToListAsync();

            var projectTrendRows = await _context.Projects
                .AsNoTracking()
                .Where(project => project.CreatedAt >= rangeStart)
                .GroupBy(project => new { project.CreatedAt.Year, project.CreatedAt.Month })
                .Select(group => new { group.Key.Year, group.Key.Month, Count = group.Count() })
                .ToListAsync();

            var departmentTrendRows = await _context.Customers
                .AsNoTracking()
                .Where(department => department.Type == DepartmentType && department.CreatedAt >= rangeStart)
                .GroupBy(department => new { department.CreatedAt.Year, department.CreatedAt.Month })
                .Select(group => new { group.Key.Year, group.Key.Month, Count = group.Count() })
                .ToListAsync();

            var peopleTrendRows = await _context.Contacts
                .AsNoTracking()
                .Where(person => person.Organization.Type == DepartmentType && person.CreatedAt >= rangeStart)
                .GroupBy(person => new { person.CreatedAt.Year, person.CreatedAt.Month })
                .Select(group => new { group.Key.Year, group.Key.Month, Count = group.Count() })
                .ToListAsync();

            var followUpTrendRows = await _context.FollowUps
                .AsNoTracking()
                .Where(followUp => followUp.CreatedAt >= rangeStart)
                .GroupBy(followUp => new { followUp.CreatedAt.Year, followUp.CreatedAt.Month })
                .Select(group => new { group.Key.Year, group.Key.Month, Count = group.Count() })
                .ToListAsync();

            var taskTrend = taskTrendRows.ToDictionary(row => (row.Year, row.Month), row => row.Count);
            var projectTrend = projectTrendRows.ToDictionary(row => (row.Year, row.Month), row => row.Count);
            var departmentTrend = departmentTrendRows.ToDictionary(row => (row.Year, row.Month), row => row.Count);
            var peopleTrend = peopleTrendRows.ToDictionary(row => (row.Year, row.Month), row => row.Count);
            var followUpTrend = followUpTrendRows.ToDictionary(row => (row.Year, row.Month), row => row.Count);

            var activityTrend = new List<ReportTrendPoint>();
            for (var index = 0; index < months; index++)
            {
                var month = rangeStart.AddMonths(index);
                var key = (month.Year, month.Month);

                activityTrend.Add(new ReportTrendPoint
                {
                    Period = month.ToString("yyyy-MM"),
                    Label = month.ToString("MMM yyyy"),
                    TasksCreated = taskTrend.GetValueOrDefault(key),
                    ProjectsCreated = projectTrend.GetValueOrDefault(key),
                    DepartmentsCreated = departmentTrend.GetValueOrDefault(key),
                    PeopleCreated = peopleTrend.GetValueOrDefault(key),
                    FollowUpsCreated = followUpTrend.GetValueOrDefault(key)
                });
            }

            var projectPerformance = await _context.Projects
                .AsNoTracking()
                .Select(project => new ProjectPerformanceItem
                {
                    ProjectId = project.Id,
                    ProjectName = project.Name,
                    Status = project.Status,
                    TotalTasks = project.Tasks.Count,
                    CompletedTasks = project.Tasks.Count(task => task.Status == "Finished"),
                    OverdueTasks = project.Tasks.Count(task =>
                        task.DueDate.HasValue && task.DueDate < now &&
                        task.Status != "Finished" && task.Status != "Cancelled")
                })
                .OrderByDescending(project => project.TotalTasks)
                .ThenBy(project => project.ProjectName)
                .Take(8)
                .ToListAsync();

            foreach (var project in projectPerformance)
            {
                project.CompletionRate = project.TotalTasks == 0
                    ? 0
                    : Math.Round((double)project.CompletedTasks / project.TotalTasks * 100, 1);
            }

            var userWorkload = await _context.Users
                .AsNoTracking()
                .Where(user => user.IsActive)
                .Select(user => new UserWorkloadReportItem
                {
                    UserId = user.Id,
                    UserName = user.FullName,
                    OpenTasks = user.TaskAssignments.Count(assignment =>
                        assignment.TaskItem.Status != "Finished" &&
                        assignment.TaskItem.Status != "Cancelled"),
                    OverdueTasks = user.TaskAssignments.Count(assignment =>
                        assignment.TaskItem.DueDate.HasValue &&
                        assignment.TaskItem.DueDate < now &&
                        assignment.TaskItem.Status != "Finished" &&
                        assignment.TaskItem.Status != "Cancelled"),
                    DueSoonTasks = user.TaskAssignments.Count(assignment =>
                        assignment.TaskItem.DueDate.HasValue &&
                        assignment.TaskItem.DueDate >= now &&
                        assignment.TaskItem.DueDate <= dueSoonEnd &&
                        assignment.TaskItem.Status != "Finished" &&
                        assignment.TaskItem.Status != "Cancelled")
                })
                .OrderByDescending(item => item.OpenTasks)
                .ThenBy(item => item.UserName)
                .Take(10)
                .ToListAsync();

            return Ok(new WorkspaceReportResponse
            {
                GeneratedAt = now,
                Months = months,
                Summary = new ReportSummary
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
                    TaskCompletionRate = totalTasks == 0
                        ? 0
                        : Math.Round((double)completedTasks / totalTasks * 100, 1)
                },
                TaskStatus = taskStatus,
                TaskPriority = taskPriority,
                ProjectStatus = projectStatus,
                DepartmentStatus = departmentStatus,
                FollowUpStatus = followUpStatus,
                ActivityTrend = activityTrend,
                ProjectPerformance = projectPerformance,
                UserWorkload = userWorkload
            });
        }
    }
}
