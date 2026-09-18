using Application.Common;
using Application.DTOs.Tasks.SubTask;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubTasksController : ControllerBase
    {
        private readonly IGenericRepository<SubTask> _subTaskRepo;
        private readonly IGenericRepository<TaskItem> _taskRepo;
        private readonly IMapper _mapper;

        public SubTasksController(
            IGenericRepository<SubTask> subTaskRepo,
            IGenericRepository<TaskItem> taskRepo,
            IMapper mapper)
        {
            _subTaskRepo = subTaskRepo;
            _taskRepo = taskRepo;
            _mapper = mapper;
        }

        // GET: api/SubTasks
        [HttpGet]
        public async Task<IActionResult> GetSubTasks(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedSubTasks = await _subTaskRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    orderBy: q => q.OrderByDescending(s => s.Id));

                var responses = _mapper.Map<List<SubTaskResponse>>(pagedSubTasks.Data);
                foreach (var response in responses)
                {
                    var task = await _taskRepo.GetByIdAsync(response.TaskItemId);
                    response.TaskTitle = task?.Title;
                }

                return Ok(new Pagination<SubTaskResponse>(
                    pagedSubTasks.PageIndex,
                    pagedSubTasks.PageSize,
                    pagedSubTasks.Count,
                    responses));
            }

            var subTasks = await _subTaskRepo.GetQueryable()
                .OrderByDescending(s => s.Id)
                .ToListAsync();

            var list = _mapper.Map<List<SubTaskResponse>>(subTasks);
            foreach (var response in list)
            {
                var task = await _taskRepo.GetByIdAsync(response.TaskItemId);
                response.TaskTitle = task?.Title;
            }

            return Ok(list);
        }

        // GET: api/SubTasks/1
        [HttpGet("{id:int}")]
        public async Task<ActionResult<SubTaskResponse>> GetSubTask(int id)
        {
            var subTask = await _subTaskRepo.GetByIdAsync(id);

            if (subTask == null)
            {
                return NotFound(new
                {
                    message = "Subtask not found."
                });
            }

            var task = await _taskRepo.GetByIdAsync(subTask.TaskItemId);
            var response = _mapper.Map<SubTaskResponse>(subTask);
            response.TaskTitle = task?.Title;

            return Ok(response);
        }

        // GET: api/SubTasks/task/1
        [HttpGet("task/{taskId:int}")]
        public async Task<IActionResult> GetSubTasksByTask(
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
                var pagedSubTasks = await _subTaskRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: s => s.TaskItemId == taskId,
                    orderBy: q => q.OrderBy(s => s.Id));

                var responses = _mapper.Map<List<SubTaskResponse>>(pagedSubTasks.Data);
                foreach (var response in responses)
                {
                    response.TaskTitle = task.Title;
                }

                return Ok(new Pagination<SubTaskResponse>(
                    pagedSubTasks.PageIndex,
                    pagedSubTasks.PageSize,
                    pagedSubTasks.Count,
                    responses));
            }

            var taskSubTasks = await _subTaskRepo.GetQueryable()
                .Where(s => s.TaskItemId == taskId)
                .OrderBy(s => s.Id)
                .ToListAsync();

            var list = _mapper.Map<List<SubTaskResponse>>(taskSubTasks);
            foreach (var response in list)
            {
                response.TaskTitle = task.Title;
            }

            return Ok(list);
        }

        // POST: api/SubTasks
        [HttpPost]
        public async Task<ActionResult<SubTaskResponse>> CreateSubTask(CreateSubTaskRequest request)
        {
            var task = await _taskRepo.GetByIdAsync(request.TaskItemId);

            if (task == null)
            {
                return BadRequest(new
                {
                    message = "The specified task does not exist."
                });
            }

            var subTask = _mapper.Map<SubTask>(request);

            await _subTaskRepo.AddAsync(subTask);
            await _subTaskRepo.SaveChangesAsync();

            var response = _mapper.Map<SubTaskResponse>(subTask);
            response.TaskTitle = task.Title;

            return CreatedAtAction(
                nameof(GetSubTask),
                new { id = subTask.Id },
                response);
        }

        // PUT: api/SubTasks/1
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateSubTask(int id, UpdateSubTaskRequest request)
        {
            var subTask = await _subTaskRepo.GetByIdAsync(id);

            if (subTask == null)
            {
                return NotFound(new
                {
                    message = "Subtask not found."
                });
            }

            _mapper.Map(request, subTask);

            _subTaskRepo.Update(subTask);
            await _subTaskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Subtask updated successfully."
            });
        }

        // PATCH: api/SubTasks/1/complete
        [HttpPatch("{id:int}/complete")]
        public async Task<IActionResult> CompleteSubTask(int id)
        {
            var subTask = await _subTaskRepo.GetByIdAsync(id);

            if (subTask == null)
            {
                return NotFound(new
                {
                    message = "Subtask not found."
                });
            }

            subTask.IsCompleted = true;

            _subTaskRepo.Update(subTask);
            await _subTaskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Subtask completed successfully."
            });
        }

        // PATCH: api/SubTasks/1/uncomplete
        [HttpPatch("{id:int}/uncomplete")]
        public async Task<IActionResult> UncompleteSubTask(int id)
        {
            var subTask = await _subTaskRepo.GetByIdAsync(id);

            if (subTask == null)
            {
                return NotFound(new
                {
                    message = "Subtask not found."
                });
            }

            subTask.IsCompleted = false;

            _subTaskRepo.Update(subTask);
            await _subTaskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Subtask marked as incomplete."
            });
        }

        // PATCH: api/SubTasks/1/toggle
        [HttpPatch("{id:int}/toggle")]
        public async Task<IActionResult> ToggleSubTask(int id)
        {
            var subTask = await _subTaskRepo.GetByIdAsync(id);

            if (subTask == null)
            {
                return NotFound(new
                {
                    message = "Subtask not found."
                });
            }

            subTask.IsCompleted = !subTask.IsCompleted;

            _subTaskRepo.Update(subTask);
            await _subTaskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = $"Subtask marked as {(subTask.IsCompleted ? "completed" : "incomplete")}.",
                id = subTask.Id,
                isCompleted = subTask.IsCompleted
            });
        }

        // DELETE: api/SubTasks/1
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteSubTask(int id)
        {
            var subTask = await _subTaskRepo.GetByIdAsync(id);

            if (subTask == null)
            {
                return NotFound(new
                {
                    message = "Subtask not found."
                });
            }

            _subTaskRepo.Delete(subTask);
            await _subTaskRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Subtask deleted successfully."
            });
        }
    }
}
