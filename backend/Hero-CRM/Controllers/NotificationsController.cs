using Application.Common;
using Application.DTOs.Collaborations.Notification;
using Application.Repos_Interfaces;
using Application.Services_Interfaces;
using AutoMapper;
using Domain.Entities.Collaborations;
using Domain.Entities.Identity;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Hero_CRM.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly IGenericRepository<Notification> _notificationRepo;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMapper _mapper;

        public NotificationsController(
            IGenericRepository<Notification> notificationRepo,
            INotificationService notificationService,
            IEmailService emailService,
            UserManager<ApplicationUser> userManager,
            IMapper mapper)
        {
            _notificationRepo = notificationRepo;
            _notificationService = notificationService;
            _emailService = emailService;
            _userManager = userManager;
            _mapper = mapper;
        }


        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetUserNotifications(
            int userId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedNotifications = await _notificationRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: n => n.UserId == userId,
                    orderBy: q => q.OrderByDescending(n => n.CreatedAt));

                var data = _mapper.Map<IEnumerable<NotificationResponse>>(pagedNotifications.Data);
                return Ok(new Pagination<NotificationResponse>(
                    pagedNotifications.PageIndex,
                    pagedNotifications.PageSize,
                    pagedNotifications.Count,
                    data));
            }

            var userNotifications = await _notificationRepo.GetQueryable()
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            var response = _mapper.Map<IEnumerable<NotificationResponse>>(userNotifications);
            return Ok(response);
        }


        [HttpPatch("{id:int}/read")]
        [HttpPut("{id:int}/read")]
        [HttpPost("{id:int}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _notificationRepo.GetByIdAsync(id);

            if (notification == null)
            {
                return NotFound(new
                {
                    message = "Notification not found."
                });
            }

            if (!notification.IsRead)
            {
                notification.IsRead = true;
                _notificationRepo.Update(notification);
                await _notificationRepo.SaveChangesAsync();
            }

            return Ok(new
            {
                message = "Notification marked as read."
            });
        }

        [HttpPatch("user/{userId:int}/read-all")]
        [HttpPut("user/{userId:int}/read-all")]
        [HttpPost("user/{userId:int}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(int userId)
        {
            var unreadNotifications = await _notificationRepo.GetQueryable()
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                _notificationRepo.Update(notification);
            }

            if (unreadNotifications.Count > 0)
            {
                await _notificationRepo.SaveChangesAsync();
            }

            return Ok(new
            {
                message = "All notifications marked as read."
            });
        }

        [HttpGet("user/{userId:int}/unread-count")]
        public async Task<IActionResult> GetUnreadCount(int userId)
        {
            var count = await _notificationRepo.GetQueryable()
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            return Ok(new
            {
                userId,
                unreadCount = count
            });
        }

        [HttpGet("email-status")]
        public IActionResult GetEmailStatus()
        {
            return Ok(new
            {
                isConfigured = _emailService.IsConfigured
            });
        }

        [HttpPost("test-email")]
        public async Task<IActionResult> SendTestEmail([FromBody(EmptyBodyBehavior = Microsoft.AspNetCore.Mvc.ModelBinding.EmptyBodyBehavior.Allow)] TestEmailRequest? request = null)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")?.Value
                ?? User.FindFirst("id")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "User is not authenticated." });
            }

            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var targetEmail = !string.IsNullOrWhiteSpace(request?.TargetEmail) ? request.TargetEmail.Trim() : user.Email;
            if (string.IsNullOrWhiteSpace(targetEmail))
            {
                return BadRequest(new { message = "No valid email address found for this user." });
            }

            var title = "Hero CRM Notification Test";
            var message = $"Hello {user.FullName}! This notification verifies that in-app alerts and email notifications are delivered simultaneously to {targetEmail} at {CairoTimeHelper.Format(DateTime.UtcNow)}.";

            await _notificationService.SendNotificationAsync(
                userId,
                title,
                message,
                NotificationType.General,
                itemName: "Hero CRM Email Integration");

            bool isConfigured = _emailService.IsConfigured;

            return Ok(new
            {
                success = true,
                isConfigured = isConfigured,
                email = targetEmail,
                message = isConfigured
                    ? $"Notification created and email successfully sent to {targetEmail}!"
                    : $"In-app notification created! However, live email delivery to Gmail requires setting 'EmailSettings:SenderEmail' and your Google App Password in 'EmailSettings:SenderPassword' in appsettings.json."
            });
        }

        [HttpPost("check-deadlines")]
        public async Task<IActionResult> CheckDeadlines()
        {
            var count = await _notificationService.CheckAndSendDeadlineNotificationsAsync();
            return Ok(new
            {
                success = true,
                count,
                message = count > 0
                    ? $"Deadline check completed: {count} notification(s) and email(s) dispatched."
                    : "Deadline check completed: No new deadline reminders or alerts were needed at this time."
            });
        }
    }

    public class TestEmailRequest
    {
        public string? TargetEmail { get; set; }
    }
}
