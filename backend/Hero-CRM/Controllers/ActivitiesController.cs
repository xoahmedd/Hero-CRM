using Application.Common;
using Application.DTOs.Collaborations.Activity;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Collaborations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ActivitiesController : ControllerBase
    {
        private readonly IGenericRepository<Activity> _activityRepo;
        private readonly IMapper _mapper;

        public ActivitiesController(IGenericRepository<Activity> activityRepo, IMapper mapper)
        {
            _activityRepo = activityRepo;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetActivities(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedActivities = await _activityRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    orderBy: q => q.OrderByDescending(a => a.CreatedAt));

                var data = _mapper.Map<IEnumerable<ActivityResponse>>(pagedActivities.Data);
                return Ok(new Pagination<ActivityResponse>(pagedActivities.PageIndex, pagedActivities.PageSize, pagedActivities.Count, data));
            }

            var activities = await _activityRepo.GetQueryable()
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(_mapper.Map<IEnumerable<ActivityResponse>>(activities));
        }

        [HttpGet("entity/{entityType}/{entityId:int}")]
        public async Task<IActionResult> GetEntityActivities(
            string entityType,
            int entityId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedActivities = await _activityRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: a => a.EntityType == entityType && a.EntityId == entityId,
                    orderBy: q => q.OrderByDescending(a => a.CreatedAt));

                var data = _mapper.Map<IEnumerable<ActivityResponse>>(pagedActivities.Data);
                return Ok(new Pagination<ActivityResponse>(pagedActivities.PageIndex, pagedActivities.PageSize, pagedActivities.Count, data));
            }

            var activities = await _activityRepo.GetQueryable()
                .Where(a => a.EntityType == entityType && a.EntityId == entityId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();

            return Ok(_mapper.Map<IEnumerable<ActivityResponse>>(activities));
        }
    }
}
