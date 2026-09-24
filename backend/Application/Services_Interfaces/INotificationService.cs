using System;
using System.Threading.Tasks;
using Domain.Enums;

namespace Application.Services_Interfaces
{
    public interface INotificationService
    {
        Task SendNotificationAsync(int userId, string title, string message, NotificationType type = NotificationType.General, int? projectId = null, int? taskId = null, string? itemName = null);
        Task NotifyProjectAssignmentAsync(int userId, int projectId, string projectName);
        Task NotifyTaskAssignmentAsync(int userId, int taskId, string taskTitle, string projectName);
        Task NotifyDeadlineApproachingAsync(int userId, string itemTitle, DateTime dueDate, int? projectId = null, int? taskId = null);
        Task NotifyDeadlineMissedAsync(int userId, string itemTitle, DateTime dueDate, int? projectId = null, int? taskId = null);
        Task<int> CheckAndSendDeadlineNotificationsAsync();
    }
}
