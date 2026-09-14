using Application.Common;
using Application.DTOs.Collaborations.Notification;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Collaborations;
using Domain.Entities.Identity;
using Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly IGenericRepository<Notification> _notificationRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMapper _mapper;

        public NotificationsController(
            IGenericRepository<Notification> notificationRepo,
            UserManager<ApplicationUser> userManager,
            IMapper mapper)
        {
            _notificationRepo = notificationRepo;
            _userManager = userManager;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotifications(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedNotifications = await _notificationRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    orderBy: q => q.OrderByDescending(n => n.CreatedAt));

                var data = _mapper.Map<IEnumerable<NotificationResponse>>(pagedNotifications.Data);
                return Ok(new Pagination<NotificationResponse>(
                    pagedNotifications.PageIndex,
                    pagedNotifications.PageSize,
                    pagedNotifications.Count,
                    data));
            }

            var notifications = await _notificationRepo.GetQueryable()
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(_mapper.Map<IEnumerable<NotificationResponse>>(notifications));
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

        [HttpPost]
        public async Task<ActionResult<NotificationResponse>> CreateNotification(CreateNotificationRequest request)
        {
            var user = await _userManager.FindByIdAsync(request.UserId.ToString());

            if (user == null || !user.IsActive)
            {
                return BadRequest(new
                {
                    message = "User not found or inactive."
                });
            }

            if (string.IsNullOrWhiteSpace(request.Title) ||
                string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new
                {
                    message = "Title and message are required."
                });
            }

            var notification = new Notification
            {
                UserId = request.UserId,
                Title = request.Title.Trim(),
                Message = request.Message.Trim(),
                Type = request.Type,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepo.AddAsync(notification);
            await _notificationRepo.SaveChangesAsync();

            var response = _mapper.Map<NotificationResponse>(notification);
            return Ok(response);
        }

        [HttpPatch("{id:int}/read")]
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
    }
}
