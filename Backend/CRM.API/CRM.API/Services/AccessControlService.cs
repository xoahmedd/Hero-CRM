using System.Security.Claims;
using CRM.API.Data;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Services
{
    public class AccessControlService
    {
        private readonly ApplicationDbContext _context;

        public AccessControlService(ApplicationDbContext context)
        {
            _context = context;
        }

        public static bool IsManagementUser(ClaimsPrincipal user) =>
            user.IsInRole("Admin");

        public static bool IsUser(ClaimsPrincipal user) =>
            user.IsInRole("User");

        public static int? GetUserId(ClaimsPrincipal user)
        {
            var value = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var userId) ? userId : null;
        }

        public async Task<bool> CanAccessTaskAsync(
            ClaimsPrincipal user,
            int taskId,
            CancellationToken cancellationToken = default)
        {
            if (IsManagementUser(user)) return true;

            var userId = GetUserId(user);
            if (userId == null) return false;

            return await _context.TaskItems.AsNoTracking().AnyAsync(
                task => task.Id == taskId &&
                    (task.CreatedById == userId.Value ||
                     task.Assignees.Any(a => a.UserId == userId.Value)),
                cancellationToken);
        }

        public async Task<bool> CanAccessProjectAsync(
            ClaimsPrincipal user,
            int projectId,
            CancellationToken cancellationToken = default)
        {
            if (IsManagementUser(user)) return true;

            var userId = GetUserId(user);
            if (userId == null) return false;

            return await _context.Projects.AsNoTracking().AnyAsync(
                project => project.Id == projectId &&
                    (project.OwnerId == userId.Value ||
                     project.Members.Any(m => m.UserId == userId.Value) ||
                     (project.TeamId != null &&
                      project.Team != null &&
                      project.Team.Members.Any(m => m.UserId == userId.Value)) ||
                     project.Tasks.Any(t => t.Assignees.Any(a => a.UserId == userId.Value))),
                cancellationToken);
        }
    }
}
