using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Services
{
    public class WorkspaceNotificationService
    {
        private readonly ApplicationDbContext _context;

        public WorkspaceNotificationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public void Add(
            int userId,
            string title,
            string message,
            string type = "General")
        {
            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = title.Trim(),
                Message = message.Trim(),
                Type = string.IsNullOrWhiteSpace(type) ? "General" : type.Trim(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            });
        }
    }
}
