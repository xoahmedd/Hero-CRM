using CRM.API.Data;
using CRM.API.DTOs.Notification;
using CRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("me")]
        public async Task<ActionResult<IEnumerable<NotificationResponse>>> GetMyNotifications(
            [FromQuery] bool unreadOnly = false,
            [FromQuery] int take = 100)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
            {
                return Unauthorized(new { message = "Invalid authentication token." });
            }

            take = Math.Clamp(take, 1, 200);

            var query = _context.Notifications
                .AsNoTracking()
                .Where(notification => notification.UserId == currentUserId);

            if (unreadOnly)
            {
                query = query.Where(notification => !notification.IsRead);
            }

            var notifications = await query
                .OrderByDescending(notification => notification.CreatedAt)
                .Take(take)
                .Select(notification => new NotificationResponse
                {
                    Id = notification.Id,
                    UserId = notification.UserId,
                    Title = notification.Title,
                    Message = notification.Message,
                    Type = notification.Type,
                    IsRead = notification.IsRead,
                    CreatedAt = notification.CreatedAt
                })
                .ToListAsync();

            return Ok(notifications);
        }

        [HttpGet("me/unread-count")]
        public async Task<IActionResult> GetMyUnreadCount()
        {
            if (!TryGetCurrentUserId(out var currentUserId))
            {
                return Unauthorized(new { message = "Invalid authentication token." });
            }

            var count = await _context.Notifications.CountAsync(notification =>
                notification.UserId == currentUserId && !notification.IsRead);

            return Ok(new { count });
        }

        // Compatibility endpoint retained for the current client and API consumers.
        [HttpGet("user/{userId:int}")]
        public async Task<ActionResult<IEnumerable<NotificationResponse>>> GetUserNotifications(int userId)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
            {
                return Unauthorized(new { message = "Invalid authentication token." });
            }

            if (currentUserId != userId)
            {
                return Forbid();
            }

            return await GetMyNotifications();
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<NotificationResponse>> CreateNotification(
            CreateNotificationRequest request)
        {
            var userExists = await _context.Users
                .AnyAsync(user => user.Id == request.UserId && user.IsActive);

            if (!userExists)
            {
                return BadRequest(new { message = "User not found or inactive." });
            }

            if (string.IsNullOrWhiteSpace(request.Title) ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Title and message are required." });
            }

            var notification = new Notification
            {
                UserId = request.UserId,
                Title = request.Title.Trim(),
                Message = request.Message.Trim(),
                Type = string.IsNullOrWhiteSpace(request.Type) ? "General" : request.Type.Trim(),
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(ToResponse(notification));
        }

        [HttpPatch("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
            {
                return Unauthorized(new { message = "Invalid authentication token." });
            }

            var notification = await _context.Notifications.FirstOrDefaultAsync(item =>
                item.Id == id && item.UserId == currentUserId);

            if (notification == null)
            {
                return NotFound(new { message = "Notification not found." });
            }

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "Notification marked as read." });
        }

        [HttpPatch("me/read-all")]
        public async Task<IActionResult> MarkMyNotificationsAsRead()
        {
            if (!TryGetCurrentUserId(out var currentUserId))
            {
                return Unauthorized(new { message = "Invalid authentication token." });
            }

            var notifications = await _context.Notifications
                .Where(notification => notification.UserId == currentUserId && !notification.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            if (notifications.Count > 0)
            {
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = "All notifications marked as read." });
        }

        [HttpPatch("user/{userId:int}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(int userId)
        {
            if (!TryGetCurrentUserId(out var currentUserId))
            {
                return Unauthorized(new { message = "Invalid authentication token." });
            }

            if (currentUserId != userId)
            {
                return Forbid();
            }

            return await MarkMyNotificationsAsRead();
        }

        private bool TryGetCurrentUserId(out int userId)
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out userId);
        }

        private static NotificationResponse ToResponse(Notification notification)
        {
            return new NotificationResponse
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                Type = notification.Type,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };
        }
    }
}
