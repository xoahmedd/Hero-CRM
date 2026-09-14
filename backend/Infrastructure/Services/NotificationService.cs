using System;
using System.Threading.Tasks;
using Application.Repos_Interfaces;
using Application.Services_Interfaces;
using Domain.Entities.Collaborations;
using Domain.Enums;

namespace Infrastructure.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IGenericRepository<Notification> _notificationRepo;

        public NotificationService(IGenericRepository<Notification> notificationRepo)
        {
            _notificationRepo = notificationRepo;
        }

        public async Task SendNotificationAsync(
            int userId,
            string title,
            string message,
            NotificationType type = NotificationType.General,
            int? projectId = null,
            int? taskId = null)
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
        }

        public async Task NotifyProjectAssignmentAsync(int userId, int projectId, string projectName)
        {
            await SendNotificationAsync(
                userId,
                "New Project Assigned",
                $"You have been assigned as Lead Developer for the project '{projectName}'.",
                NotificationType.ProjectAssigned,
                projectId: projectId);
        }

        public async Task NotifyTaskAssignmentAsync(int userId, int taskId, string taskTitle, string projectName)
        {
            await SendNotificationAsync(
                userId,
                "New Task Assigned",
                $"You have been assigned to task '{taskTitle}' in project '{projectName}'.",
                NotificationType.TaskAssigned,
                taskId: taskId);
        }

        public async Task NotifyDeadlineApproachingAsync(int userId, string itemTitle, DateTime dueDate, int? projectId = null, int? taskId = null)
        {
            await SendNotificationAsync(
                userId,
                "Deadline Approaching Warning",
                $"Reminder: '{itemTitle}' is due on {dueDate.ToString("yyyy-MM-dd HH:mm")}. Please complete your progress or updates.",
                NotificationType.DeadlineApproaching,
                projectId: projectId,
                taskId: taskId);
        }

        public async Task NotifyDeadlineMissedAsync(int userId, string itemTitle, DateTime dueDate, int? projectId = null, int? taskId = null)
        {
            await SendNotificationAsync(
                userId,
                "Deadline Missed / Overdue",
                $"Overdue Alert: '{itemTitle}' missed its deadline on {dueDate.ToString("yyyy-MM-dd HH:mm")}. Please submit your reason for missing the deadline.",
                NotificationType.DeadlineMissed,
                projectId: projectId,
                taskId: taskId);
        }
    }
}
