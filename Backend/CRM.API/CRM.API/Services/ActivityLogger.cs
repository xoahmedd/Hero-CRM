using CRM.API.Data;
using CRM.API.Models;

namespace CRM.API.Services
{
    public class ActivityLogger
    {
        private readonly ApplicationDbContext _context;

        public ActivityLogger(ApplicationDbContext context)
        {
            _context = context;
        }

        public void Add(
            int userId,
            string entityType,
            int entityId,
            string action,
            string? description = null)
        {
            _context.Activities.Add(new Activity
            {
                UserId = userId,
                EntityType = entityType,
                EntityId = entityId,
                Action = action,
                Description = description,
                CreatedAt = DateTime.UtcNow
            });
        }
    }
}
