using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Application.Services_Interfaces;
using Domain.Enums;
using Infrastructure._Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    public class DeadlineCheckBackgroundService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DeadlineCheckBackgroundService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(30);

        public DeadlineCheckBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<DeadlineCheckBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DeadlineCheckBackgroundService is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await CheckDeadlinesAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "An error occurred while checking project and task deadlines.");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("DeadlineCheckBackgroundService is stopping.");
        }

        private async Task CheckDeadlinesAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var now = DateTime.UtcNow;
            var approachingWindow = now.AddHours(48);

            // 1. Check Projects Approaching Deadline (within 48 hours)
            var approachingProjects = await dbContext.Projects
                .Where(p => p.DueDate.HasValue &&
                            p.DueDate > now &&
                            p.DueDate <= approachingWindow &&
                            p.Status != ProjectStatus.Finished)
                .ToListAsync(stoppingToken);

            foreach (var proj in approachingProjects)
            {
                bool exists = await dbContext.Notifications.AnyAsync(n =>
                    n.UserId == proj.OwnerId &&
                    n.ProjectId == proj.Id &&
                    n.Type == NotificationType.DeadlineApproaching, stoppingToken);

                if (!exists)
                {
                    await notificationService.NotifyDeadlineApproachingAsync(
                        proj.OwnerId,
                        proj.Name,
                        proj.DueDate!.Value,
                        projectId: proj.Id);
                }
            }

            // 2. Check Overdue Projects
            var overdueProjects = await dbContext.Projects
                .Where(p => p.DueDate.HasValue &&
                            p.DueDate < now &&
                            p.Status != ProjectStatus.Finished)
                .ToListAsync(stoppingToken);

            foreach (var proj in overdueProjects)
            {
                if (proj.Status != ProjectStatus.Overdue)
                {
                    proj.Status = ProjectStatus.Overdue;
                    proj.UpdatedAt = DateTime.UtcNow;
                }

                bool exists = await dbContext.Notifications.AnyAsync(n =>
                    n.UserId == proj.OwnerId &&
                    n.ProjectId == proj.Id &&
                    n.Type == NotificationType.DeadlineMissed, stoppingToken);

                if (!exists)
                {
                    await notificationService.NotifyDeadlineMissedAsync(
                        proj.OwnerId,
                        proj.Name,
                        proj.DueDate!.Value,
                        projectId: proj.Id);
                }
            }

            // 3. Check Overdue Tasks
            var overdueTasks = await dbContext.TaskItems
                .Include(t => t.Project)
                .Include(t => t.Assignees)
                .Where(t => t.DueDate.HasValue &&
                            t.DueDate < now &&
                            t.Status != TaskItemStatus.Completed)
                .ToListAsync(stoppingToken);

            foreach (var task in overdueTasks)
            {
                foreach (var assignee in task.Assignees)
                {
                    bool exists = await dbContext.Notifications.AnyAsync(n =>
                        n.UserId == assignee.UserId &&
                        n.TaskId == task.Id &&
                        n.Type == NotificationType.DeadlineMissed, stoppingToken);

                    if (!exists)
                    {
                        await notificationService.NotifyDeadlineMissedAsync(
                            assignee.UserId,
                            task.Title,
                            task.DueDate!.Value,
                            projectId: task.ProjectId,
                            taskId: task.Id);
                    }
                }
            }

            await dbContext.SaveChangesAsync(stoppingToken);
        }
    }
}
