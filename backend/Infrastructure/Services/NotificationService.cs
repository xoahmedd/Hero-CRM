using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Application.Common;
using Application.Repos_Interfaces;
using Application.Services_Interfaces;
using Domain.Entities.Collaborations;
using Domain.Entities.Identity;
using Domain.Enums;
using Infrastructure._Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IGenericRepository<Notification> _notificationRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IEmailService _emailService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            IGenericRepository<Notification> notificationRepo,
            UserManager<ApplicationUser> userManager,
            IEmailService emailService,
            ApplicationDbContext context,
            ILogger<NotificationService> logger)
        {
            _notificationRepo = notificationRepo;
            _userManager = userManager;
            _emailService = emailService;
            _context = context;
            _logger = logger;
        }

        public async Task SendNotificationAsync(
            int userId,
            string title,
            string message,
            NotificationType type = NotificationType.General,
            int? projectId = null,
            int? taskId = null,
            string? itemName = null)
        {
            var notification = new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                ProjectId = projectId,
                TaskId = taskId,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            await _notificationRepo.SaveChangesAsync();

            // Send email notification to user's registered email beside in-app notification
            try
            {
                var user = await _userManager.FindByIdAsync(userId.ToString());
                if (user != null && !string.IsNullOrWhiteSpace(user.Email))
                {
                    string? itemType = projectId.HasValue ? "Project" : (taskId.HasValue ? "Task" : null);
                    await _emailService.SendNotificationEmailAsync(
                        user.Email,
                        user.FullName ?? user.UserName ?? "User",
                        title,
                        message,
                        itemType: itemType,
                        itemName: itemName);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "[NotificationService]: Email notification could not be sent for user {UserId}", userId);
            }
        }

        public async Task NotifyProjectAssignmentAsync(int userId, int projectId, string projectName)
        {
            await SendNotificationAsync(
                userId,
                "New Project Assigned",
                $"You have been assigned as Developer for the project '{projectName}'.",
                NotificationType.ProjectAssigned,
                projectId: projectId,
                itemName: projectName);
        }

        public async Task NotifyTaskAssignmentAsync(int userId, int taskId, string taskTitle, string projectName)
        {
            await SendNotificationAsync(
                userId,
                "New Task Assigned",
                $"You have been assigned to task '{taskTitle}' in project '{projectName}'.",
                NotificationType.TaskAssigned,
                taskId: taskId,
                itemName: $"{taskTitle} ({projectName})");
        }

        public async Task NotifyDeadlineApproachingAsync(int userId, string itemTitle, DateTime dueDate, int? projectId = null, int? taskId = null)
        {
            var isProject = projectId.HasValue && !taskId.HasValue;
            var itemKind = isProject ? "Project" : "Task";
            await SendNotificationAsync(
                userId,
                "Deadline Reminder: 24h Remaining",
                $"Reminder: {itemKind} '{itemTitle}' is due in 24 hours (on {CairoTimeHelper.Format(dueDate)}). Please ensure all remaining tasks and updates are completed on time.",
                NotificationType.DeadlineApproaching,
                projectId: projectId,
                taskId: taskId,
                itemName: itemTitle);
        }

        public async Task NotifyDeadlineMissedAsync(int userId, string itemTitle, DateTime dueDate, int? projectId = null, int? taskId = null)
        {
            var isProject = projectId.HasValue && !taskId.HasValue;
            var itemKind = isProject ? "Project" : "Task";
            await SendNotificationAsync(
                userId,
                $"Deadline Reached: {itemKind}",
                $"The deadline for {itemKind.ToLower()} '{itemTitle}' has arrived ({CairoTimeHelper.Format(dueDate)}). Please complete any remaining work or submit a reason for missing the deadline.",
                NotificationType.DeadlineMissed,
                projectId: projectId,
                taskId: taskId,
                itemName: itemTitle);
        }

        public async Task<int> CheckAndSendDeadlineNotificationsAsync()
        {
            int notificationsSent = 0;
            var now = DateTime.UtcNow;
            var reminderWindow = now.AddHours(24);

            // 1. Projects Approaching Deadline (due within 24 hours: now < DueDate <= now + 24h)
            var approachingProjects = await _context.Projects
                .Include(p => p.Members)
                .Where(p => p.DueDate.HasValue &&
                            p.DueDate > now &&
                            p.DueDate <= reminderWindow &&
                            p.Status != ProjectStatus.Finished &&
                            p.Status != ProjectStatus.Cancelled)
                .ToListAsync();

            foreach (var proj in approachingProjects)
            {
                var recipients = new HashSet<int> { proj.OwnerId };
                foreach (var m in proj.Members)
                {
                    recipients.Add(m.UserId);
                }

                foreach (var uid in recipients)
                {
                    bool exists = await _context.Notifications.AnyAsync(n =>
                        n.UserId == uid &&
                        n.ProjectId == proj.Id &&
                        !n.TaskId.HasValue &&
                        n.Type == NotificationType.DeadlineApproaching);

                    if (!exists)
                    {
                        await NotifyDeadlineApproachingAsync(
                            uid,
                            proj.Name,
                            proj.DueDate!.Value,
                            projectId: proj.Id);
                        notificationsSent++;
                    }
                }
            }

            // 2. Tasks Approaching Deadline (due within 24 hours: now < DueDate <= now + 24h)
            var approachingTasks = await _context.TaskItems
                .Include(t => t.Project)
                .Include(t => t.Assignees)
                .Where(t => t.DueDate.HasValue &&
                            t.DueDate > now &&
                            t.DueDate <= reminderWindow &&
                            t.Status != TaskItemStatus.Completed &&
                            t.Status != TaskItemStatus.Cancelled)
                .ToListAsync();

            foreach (var task in approachingTasks)
            {
                foreach (var assignee in task.Assignees)
                {
                    bool exists = await _context.Notifications.AnyAsync(n =>
                        n.UserId == assignee.UserId &&
                        n.TaskId == task.Id &&
                        n.Type == NotificationType.DeadlineApproaching);

                    if (!exists)
                    {
                        await NotifyDeadlineApproachingAsync(
                            assignee.UserId,
                            task.Title,
                            task.DueDate!.Value,
                            projectId: task.ProjectId,
                            taskId: task.Id);
                        notificationsSent++;
                    }
                }
            }

            // 3. Projects where Deadline has Arrived (DueDate <= now)
            var overdueProjects = await _context.Projects
                .Include(p => p.Members)
                .Where(p => p.DueDate.HasValue &&
                            p.DueDate <= now &&
                            p.Status != ProjectStatus.Finished &&
                            p.Status != ProjectStatus.Cancelled)
                .ToListAsync();

            foreach (var proj in overdueProjects)
            {
                var recipients = new HashSet<int> { proj.OwnerId };
                foreach (var m in proj.Members)
                {
                    recipients.Add(m.UserId);
                }

                foreach (var uid in recipients)
                {
                    bool exists = await _context.Notifications.AnyAsync(n =>
                        n.UserId == uid &&
                        n.ProjectId == proj.Id &&
                        !n.TaskId.HasValue &&
                        n.Type == NotificationType.DeadlineMissed);

                    if (!exists)
                    {
                        await NotifyDeadlineMissedAsync(
                            uid,
                            proj.Name,
                            proj.DueDate!.Value,
                            projectId: proj.Id);
                        notificationsSent++;
                    }
                }
            }

            // 4. Tasks where Deadline has Arrived (DueDate <= now)
            var overdueTasks = await _context.TaskItems
                .Include(t => t.Project)
                .Include(t => t.Assignees)
                .Where(t => t.DueDate.HasValue &&
                            t.DueDate <= now &&
                            t.Status != TaskItemStatus.Completed &&
                            t.Status != TaskItemStatus.Cancelled)
                .ToListAsync();

            foreach (var task in overdueTasks)
            {
                foreach (var assignee in task.Assignees)
                {
                    bool exists = await _context.Notifications.AnyAsync(n =>
                        n.UserId == assignee.UserId &&
                        n.TaskId == task.Id &&
                        n.Type == NotificationType.DeadlineMissed);

                    if (!exists)
                    {
                        await NotifyDeadlineMissedAsync(
                            assignee.UserId,
                            task.Title,
                            task.DueDate!.Value,
                            projectId: task.ProjectId,
                            taskId: task.Id);
                        notificationsSent++;
                    }
                }
            }

            if (notificationsSent > 0)
            {
                _logger.LogInformation("[NotificationService]: CheckAndSendDeadlineNotificationsAsync sent {Count} deadline notifications & emails.", notificationsSent);
            }

            return notificationsSent;
        }
    }
}
