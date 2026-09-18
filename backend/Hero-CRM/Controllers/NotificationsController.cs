using Application.Common;
using Application.DTOs.Collaborations.Notification;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Collaborations;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly IGenericRepository<Notification> _notificationRepo;
        private readonly IMapper _mapper;

        public NotificationsController(
            IGenericRepository<Notification> notificationRepo,
            IMapper mapper)
        {
            _notificationRepo = notificationRepo;
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
    }
}
