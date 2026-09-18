using Application.DTOs.Report;
using Domain.Enums;
using Infrastructure._Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [Authorize(Roles = "Admin")]
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // GET: api/Reports/workspace?months=6
        // Workspace analytics for the Reports page
        // =========================================================
        [HttpGet("workspace")]
        public async Task<ActionResult<WorkspaceReportResponse>> GetWorkspaceReport([FromQuery] int months = 6)
        {
            if (months < 3 || months > 12)
            {
                return BadRequest(new
                {
                    message = "Months must be between 3 and 12."
                });
            }

            var now = DateTime.UtcNow;
            var currentMonth = new DateTime(now.Year, now.Month, 1);
            var rangeStart = currentMonth.AddMonths(-(months - 1));

            var totalCustomers = await _context.Customers.CountAsync();
            var totalProjects = await _context.Projects.CountAsync();
            var activeProjects = await _context.Projects
                .CountAsync(p => p.Status == ProjectStatus.Working);

            var totalTasks = await _context.TaskItems.CountAsync();
            var completedTasks = await _context.TaskItems
                .CountAsync(t => t.Status == TaskItemStatus.Completed);
            var pendingTasks = await _context.TaskItems
                .CountAsync(t =>
                    t.Status != TaskItemStatus.Completed &&
                    t.Status != TaskItemStatus.Cancelled);
            var overdueTasks = await _context.TaskItems
                .CountAsync(t =>
                    t.DueDate.HasValue &&
                    t.DueDate < now &&
                    t.Status != TaskItemStatus.Completed &&
                    t.Status != TaskItemStatus.Cancelled);

            var totalUsers = await _context.Users
                .CountAsync(u => u.IsActive);

            var taskStatus = await _context.TaskItems
                .AsNoTracking()
                .GroupBy(t => t.Status)
                .Select(group => new ReportBreakdownItem
                {
                    Name = group.Key.ToString(),
                    Count = group.Count()
                })
                .OrderByDescending(item => item.Count)
                .ToListAsync();

            var taskPriority = await _context.TaskItems
                .AsNoTracking()
                .GroupBy(t => t.Priority)
                .Select(group => new ReportBreakdownItem
                {
                    Name = group.Key.ToString(),
                    Count = group.Count()
                })
                .OrderByDescending(item => item.Count)
                .ToListAsync();

            var projectStatus = await _context.Projects
                .AsNoTracking()
                .GroupBy(p => p.Status)
                .Select(group => new ReportBreakdownItem
                {
                    Name = group.Key.ToString(),
                    Count = group.Count()
                })
                .OrderByDescending(item => item.Count)
                .ToListAsync();

            var customerStatus = await _context.Customers
                .AsNoTracking()
                .GroupBy(c => c.Status)
                .Select(group => new ReportBreakdownItem
                {
                    Name = group.Key.ToString(),
                    Count = group.Count()
                })
                .OrderByDescending(item => item.Count)
                .ToListAsync();

            var taskTrendRows = await _context.TaskItems
                .AsNoTracking()
                .Where(t => t.CreatedAt >= rangeStart)
                .GroupBy(t => new
                {
                    t.CreatedAt.Year,
                    t.CreatedAt.Month
                })
                .Select(group => new
                {
                    group.Key.Year,
                    group.Key.Month,
                    Count = group.Count()
                })
                .ToListAsync();

            var projectTrendRows = await _context.Projects
                .AsNoTracking()
                .Where(p => p.CreatedAt >= rangeStart)
                .GroupBy(p => new
                {
                    p.CreatedAt.Year,
                    p.CreatedAt.Month
                })
                .Select(group => new
                {
                    group.Key.Year,
                    group.Key.Month,
                    Count = group.Count()
                })
                .ToListAsync();

            var customerTrendRows = await _context.Customers
                .AsNoTracking()
                .Where(c => c.CreatedAt >= rangeStart)
                .GroupBy(c => new
                {
                    c.CreatedAt.Year,
                    c.CreatedAt.Month
                })
                .Select(group => new
                {
                    group.Key.Year,
                    group.Key.Month,
                    Count = group.Count()
                })
                .ToListAsync();

            var taskTrend = taskTrendRows.ToDictionary(
                row => (row.Year, row.Month),
                row => row.Count);
            var projectTrend = projectTrendRows.ToDictionary(
                row => (row.Year, row.Month),
                row => row.Count);
            var customerTrend = customerTrendRows.ToDictionary(
                row => (row.Year, row.Month),
                row => row.Count);

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
                    CustomersCreated = customerTrend.GetValueOrDefault(key)
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
                    CompletedTasks = project.Tasks.Count(task => task.Status == TaskItemStatus.Completed),
                    OverdueTasks = project.Tasks.Count(task =>
                        task.DueDate.HasValue &&
                        task.DueDate < now &&
                        task.Status != TaskItemStatus.Completed &&
                        task.Status != TaskItemStatus.Cancelled)
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

            return Ok(new WorkspaceReportResponse
            {
                GeneratedAt = now,
                Months = months,
                Summary = new ReportSummary
                {
                    TotalCustomers = totalCustomers,
                    TotalProjects = totalProjects,
                    ActiveProjects = activeProjects,
                    TotalTasks = totalTasks,
                    CompletedTasks = completedTasks,
                    PendingTasks = pendingTasks,
                    OverdueTasks = overdueTasks,
                    TotalUsers = totalUsers,
                    TaskCompletionRate = totalTasks == 0
                        ? 0
                        : Math.Round((double)completedTasks / totalTasks * 100, 1)
                },
                TaskStatus = taskStatus,
                TaskPriority = taskPriority,
                ProjectStatus = projectStatus,
                CustomerStatus = customerStatus,
                ActivityTrend = activityTrend,
                ProjectPerformance = projectPerformance
            });
        }
    }
}
