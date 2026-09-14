using Application.Common;
using Application.DTOs.Tasks.Tag;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Tasks;
using Infrastructure._Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly IGenericRepository<Tag> _tagRepo;
        private readonly IGenericRepository<TaskItem> _taskRepo;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public TagsController(
            IGenericRepository<Tag> tagRepo,
            IGenericRepository<TaskItem> taskRepo,
            ApplicationDbContext context,
            IMapper mapper)
        {
            _tagRepo = tagRepo;
            _taskRepo = taskRepo;
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetTags(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedTags = await _tagRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    orderBy: q => q.OrderBy(t => t.Name));

                var data = _mapper.Map<IEnumerable<TagResponse>>(pagedTags.Data);
                return Ok(new Pagination<TagResponse>(
                    pagedTags.PageIndex,
                    pagedTags.PageSize,
                    pagedTags.Count,
                    data));
            }

            var tags = await _tagRepo.GetQueryable()
                .OrderBy(t => t.Name)
                .ToListAsync();

            return Ok(_mapper.Map<IEnumerable<TagResponse>>(tags));
        }

        [HttpPost]
        public async Task<ActionResult<TagResponse>> CreateTag(CreateTagRequest request)
        {
            var name = request.Name.Trim();

            var exists = await _tagRepo.GetQueryable()
                .AnyAsync(t => t.Name == name);

            if (exists)
            {
                return Conflict(new
                {
                    message = "Tag already exists."
                });
            }

            var tag = new Tag
            {
                Name = name,
                Color = request.Color?.Trim()
            };

            await _tagRepo.AddAsync(tag);
            await _tagRepo.SaveChangesAsync();

            var response = _mapper.Map<TagResponse>(tag);
            return Ok(response);
        }

        [HttpPost("assign")]
        public async Task<IActionResult> AssignTag(AssignTagRequest request)
        {
            var task = await _taskRepo.GetByIdAsync(request.TaskItemId);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            var tag = await _tagRepo.GetByIdAsync(request.TagId);

            if (tag == null)
            {
                return NotFound(new
                {
                    message = "Tag not found."
                });
            }

            var exists = await _context.TaskTags
                .AnyAsync(tt => tt.TaskItemId == request.TaskItemId && tt.TagId == request.TagId);

            if (exists)
            {
                return Conflict(new
                {
                    message = "Tag is already assigned to this task."
                });
            }

            _context.TaskTags.Add(new TaskTag
            {
                TaskItemId = request.TaskItemId,
                TagId = request.TagId
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tag assigned successfully."
            });
        }

        [HttpGet("task/{taskId:int}")]
        public async Task<IActionResult> GetTaskTags(
            int taskId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var baseQuery = _context.TaskTags
                .AsNoTracking()
                .Where(tt => tt.TaskItemId == taskId)
                .Include(tt => tt.Tag)
                .Select(tt => tt.Tag)
                .OrderBy(t => t.Name);

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var index = pageIndex ?? 1;
                var size = pageSize ?? 20;

                var totalCount = await baseQuery.CountAsync();

                var pagedTags = await baseQuery
                    .Skip((index - 1) * size)
                    .Take(size)
                    .ToListAsync();

                var data = _mapper.Map<IEnumerable<TagResponse>>(pagedTags);
                return Ok(new Pagination<TagResponse>(index, size, totalCount, data));
            }

            var tags = await baseQuery.ToListAsync();
            return Ok(_mapper.Map<IEnumerable<TagResponse>>(tags));
        }

        [HttpDelete("task/{taskId:int}/tag/{tagId:int}")]
        public async Task<IActionResult> RemoveTag(int taskId, int tagId)
        {
            var taskTag = await _context.TaskTags
                .FirstOrDefaultAsync(tt => tt.TaskItemId == taskId && tt.TagId == tagId);

            if (taskTag == null)
            {
                return NotFound(new
                {
                    message = "Task tag assignment not found."
                });
            }

            _context.TaskTags.Remove(taskTag);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tag removed successfully."
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTag(int id)
        {
            var tag = await _tagRepo.GetByIdAsync(id);

            if (tag == null)
            {
                return NotFound(new
                {
                    message = "Tag not found."
                });
            }

            _tagRepo.Delete(tag);
            await _tagRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Tag deleted successfully."
            });
        }
    }
}
