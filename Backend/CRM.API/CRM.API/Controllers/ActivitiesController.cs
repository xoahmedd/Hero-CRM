using CRM.API.Data;
using CRM.API.DTOs.Activity;
using CRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class ActivitiesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ActivitiesController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ActivityResponse>>>
            GetActivities()
        {
            var activities = await _context.Activities
                .AsNoTracking()
                .Include(a => a.User)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new ActivityResponse
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    UserName = a.User.FullName,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    Action = a.Action,
                    Description = a.Description,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(activities);
        }

        [HttpGet("entity/{entityType}/{entityId:int}")]
        public async Task<ActionResult<IEnumerable<ActivityResponse>>>
            GetEntityActivities(
                string entityType,
                int entityId)
        {
            var activities = await _context.Activities
                .AsNoTracking()
                .Include(a => a.User)
                .Where(a =>
                    a.EntityType == entityType &&
                    a.EntityId == entityId)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new ActivityResponse
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    UserName = a.User.FullName,
                    EntityType = a.EntityType,
                    EntityId = a.EntityId,
                    Action = a.Action,
                    Description = a.Description,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(activities);
        }
    }
}