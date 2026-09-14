using Application.Common;
using Application.DTOs.Collaborations.Attachment;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Collaborations;
using Domain.Entities.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttachmentsController : ControllerBase
    {
        private readonly IGenericRepository<Attachment> _attachmentRepo;
        private readonly IGenericRepository<TaskItem> _taskRepo;
        private readonly IMapper _mapper;

        public AttachmentsController(
            IGenericRepository<Attachment> attachmentRepo,
            IGenericRepository<TaskItem> taskRepo,
            IMapper mapper)
        {
            _attachmentRepo = attachmentRepo;
            _taskRepo = taskRepo;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetAttachments(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedAttachments = await _attachmentRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    orderBy: q => q.OrderByDescending(a => a.UploadedAt));

                var data = _mapper.Map<List<AttachmentResponse>>(pagedAttachments.Data);
                return Ok(new Pagination<AttachmentResponse>(
                    pagedAttachments.PageIndex,
                    pagedAttachments.PageSize,
                    pagedAttachments.Count,
                    data));
            }

            var attachments = await _attachmentRepo.GetQueryable()
                .OrderByDescending(a => a.UploadedAt)
                .ToListAsync();

            return Ok(_mapper.Map<IEnumerable<AttachmentResponse>>(attachments));
        }

        [HttpGet("task/{taskId:int}")]
        public async Task<IActionResult> GetTaskAttachments(
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
                var pagedAttachments = await _attachmentRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: a => a.TaskItemId == taskId,
                    orderBy: q => q.OrderByDescending(a => a.UploadedAt));

                var responses = _mapper.Map<List<AttachmentResponse>>(pagedAttachments.Data);
                foreach (var response in responses)
                {
                    response.TaskTitle = task.Title;
                }

                return Ok(new Pagination<AttachmentResponse>(
                    pagedAttachments.PageIndex,
                    pagedAttachments.PageSize,
                    pagedAttachments.Count,
                    responses));
            }

            var taskAttachments = await _attachmentRepo.GetQueryable()
                .Where(a => a.TaskItemId == taskId)
                .OrderByDescending(a => a.UploadedAt)
                .ToListAsync();

            var list = _mapper.Map<List<AttachmentResponse>>(taskAttachments);
            foreach (var response in list)
            {
                response.TaskTitle = task.Title;
            }

            return Ok(list);
        }

        [HttpPost]
        public async Task<ActionResult<AttachmentResponse>> CreateAttachment(CreateAttachmentRequest request)
        {
            var task = await _taskRepo.GetByIdAsync(request.TaskItemId);

            if (task == null)
            {
                return BadRequest(new
                {
                    message = "The specified task does not exist."
                });
            }

            var attachment = _mapper.Map<Attachment>(request);

            await _attachmentRepo.AddAsync(attachment);
            await _attachmentRepo.SaveChangesAsync();

            var response = _mapper.Map<AttachmentResponse>(attachment);
            response.TaskTitle = task.Title;

            return Ok(response);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteAttachment(int id)
        {
            var attachment = await _attachmentRepo.GetByIdAsync(id);

            if (attachment == null)
            {
                return NotFound(new
                {
                    message = "Attachment not found."
                });
            }

            _attachmentRepo.Delete(attachment);
            await _attachmentRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Attachment deleted successfully."
            });
        }
    }
}
