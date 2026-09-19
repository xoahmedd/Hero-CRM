using Application.Common;
using Application.DTOs.Collaborations.Comment;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Collaborations;
using Domain.Entities.Identity;
using Domain.Entities.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CommentsController : ControllerBase
    {
        private readonly IGenericRepository<Comment> _commentRepo;
        private readonly IGenericRepository<TaskItem> _taskRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IMapper _mapper;

        public CommentsController(
            IGenericRepository<Comment> commentRepo,
            IGenericRepository<TaskItem> taskRepo,
            UserManager<ApplicationUser> userManager,
            IMapper mapper)
        {
            _commentRepo = commentRepo;
            _taskRepo = taskRepo;
            _userManager = userManager;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetComments(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedComments = await _commentRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    orderBy: q => q.OrderByDescending(c => c.CreatedAt));

                var responses = _mapper.Map<List<CommentResponse>>(pagedComments.Data);
                foreach (var response in responses)
                {
                    var task = await _taskRepo.GetByIdAsync(response.TaskItemId);
                    response.TaskTitle = task?.Title;
                    var user = await _userManager.FindByIdAsync(response.UserId.ToString());
                    response.UserName = user?.FullName;
                }

                return Ok(new Pagination<CommentResponse>(
                    pagedComments.PageIndex,
                    pagedComments.PageSize,
                    pagedComments.Count,
                    responses));
            }

            var comments = await _commentRepo.GetQueryable()
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            var list = _mapper.Map<List<CommentResponse>>(comments);
            foreach (var response in list)
            {
                var task = await _taskRepo.GetByIdAsync(response.TaskItemId);
                response.TaskTitle = task?.Title;
                var user = await _userManager.FindByIdAsync(response.UserId.ToString());
                response.UserName = user?.FullName;
            }

            return Ok(list);
        }

        [HttpGet("task/{taskId:int}")]
        public async Task<IActionResult> GetTaskComments(
            int taskId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var task = await _taskRepo.GetByIdAsync(taskId);

            if (task == null)
            {
                return NotFound(new
                {
                    message = "Task not found."
                });
            }

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedComments = await _commentRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: c => c.TaskItemId == taskId,
                    orderBy: q => q.OrderBy(c => c.CreatedAt));

                var responses = _mapper.Map<List<CommentResponse>>(pagedComments.Data);
                foreach (var response in responses)
                {
                    response.TaskTitle = task.Title;
                    var user = await _userManager.FindByIdAsync(response.UserId.ToString());
                    response.UserName = user?.FullName;
                }

                return Ok(new Pagination<CommentResponse>(
                    pagedComments.PageIndex,
                    pagedComments.PageSize,
                    pagedComments.Count,
                    responses));
            }

            var taskComments = await _commentRepo.GetQueryable()
                .Where(c => c.TaskItemId == taskId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();

            var list = _mapper.Map<List<CommentResponse>>(taskComments);
            foreach (var response in list)
            {
                response.TaskTitle = task.Title;
                var user = await _userManager.FindByIdAsync(response.UserId.ToString());
                response.UserName = user?.FullName;
            }

            return Ok(list);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<CommentResponse>> GetComment(int id)
        {
            var comment = await _commentRepo.GetByIdAsync(id);

            if (comment == null)
            {
                return NotFound(new
                {
                    message = "Comment not found."
                });
            }

            var task = await _taskRepo.GetByIdAsync(comment.TaskItemId);
            var user = await _userManager.FindByIdAsync(comment.UserId.ToString());

            var response = _mapper.Map<CommentResponse>(comment);
            response.TaskTitle = task?.Title;
            response.UserName = user?.FullName;

            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<CommentResponse>> CreateComment(CreateCommentRequest request)
        {
            var task = await _taskRepo.GetByIdAsync(request.TaskItemId);

            if (task == null)
            {
                return BadRequest(new
                {
                    message = "The specified task does not exist."
                });
            }

            var user = await _userManager.FindByIdAsync(request.UserId.ToString());

            if (user == null || !user.IsActive)
            {
                return BadRequest(new
                {
                    message = "The specified user does not exist."
                });
            }

            var comment = new Comment
            {
                TaskItemId = request.TaskItemId,
                UserId = request.UserId,
                Content = request.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            await _commentRepo.AddAsync(comment);
            await _commentRepo.SaveChangesAsync();

            var response = _mapper.Map<CommentResponse>(comment);
            response.TaskTitle = task.Title;
            response.UserName = user.FullName;

            return CreatedAtAction(
                nameof(GetComment),
                new { id = comment.Id },
                response);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            var comment = await _commentRepo.GetByIdAsync(id);

            if (comment == null)
            {
                return NotFound(new
                {
                    message = "Comment not found."
                });
            }

            _commentRepo.Delete(comment);
            await _commentRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Comment deleted successfully."
            });
        }
    }
}
