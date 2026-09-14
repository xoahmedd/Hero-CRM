using Application.Common;
using Application.DTOs.Common;
using Application.DTOs.Projects;
using Application.Repos_Interfaces;
using Application.Services_Interfaces;
using AutoMapper;
using Domain.Entities.Customers;
using Domain.Entities.Identity;
using Domain.Entities.Projects;
using Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IGenericRepository<Project> _projectRepo;
        private readonly IGenericRepository<Customer> _customerRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly INotificationService _notificationService;
        private readonly IMapper _mapper;

        public ProjectsController(
            IGenericRepository<Project> projectRepo,
            IGenericRepository<Customer> customerRepo,
            UserManager<ApplicationUser> userManager,
            INotificationService notificationService,
            IMapper mapper)
        {
            _projectRepo = projectRepo;
            _customerRepo = customerRepo;
            _userManager = userManager;
            _notificationService = notificationService;
            _mapper = mapper;
        }

        private async Task<ProjectResponse> MapToResponseAsync(Project project)
        {
            var response = _mapper.Map<ProjectResponse>(project);

            var owner = await _userManager.FindByIdAsync(project.OwnerId.ToString());
            response.OwnerName = owner?.FullName;

            if (project.CustomerId.HasValue)
            {
                var customer = await _customerRepo.GetByIdAsync(project.CustomerId.Value);
                response.CustomerName = customer?.Name;
            }

            return response;
        }

        // GET: api/Projects
        [HttpGet]
        public async Task<IActionResult> GetProjects(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null,
            [FromQuery] string? search = null,
            [FromQuery] ProjectStatus? status = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue || !string.IsNullOrWhiteSpace(search) || status.HasValue)
            {
                var s = search?.Trim();

                var pagedProjects = await _projectRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: p =>
                        (string.IsNullOrWhiteSpace(s) || (
                            p.Name.Contains(s) ||
                            (p.Description != null && p.Description.Contains(s))
                        )) &&
                        (!status.HasValue || p.Status == status.Value),
                    orderBy: q => q.OrderByDescending(p => p.CreatedAt));

                var responses = new List<ProjectResponse>();
                foreach (var p in pagedProjects.Data)
                {
                    responses.Add(await MapToResponseAsync(p));
                }

                return Ok(new Pagination<ProjectResponse>(
                    pagedProjects.PageIndex,
                    pagedProjects.PageSize,
                    pagedProjects.Count,
                    responses));
            }

            var projects = await _projectRepo.GetQueryable()
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var list = new List<ProjectResponse>();
            foreach (var p in projects)
            {
                list.Add(await MapToResponseAsync(p));
            }

            return Ok(list);
        }

        // GET: api/Projects/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProjectResponse>> GetProject(int id)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            var response = await MapToResponseAsync(project);
            return Ok(response);
        }

        // GET: api/Projects/customer/1
        [HttpGet("customer/{customerId:int}")]
        public async Task<IActionResult> GetProjectsByCustomer(
            int customerId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var customer = await _customerRepo.GetByIdAsync(customerId);

            if (customer == null)
            {
                return NotFound(new
                {
                    message = "Customer not found."
                });
            }

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedProjects = await _projectRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: p => p.CustomerId == customerId,
                    orderBy: q => q.OrderByDescending(p => p.CreatedAt));

                var responses = new List<ProjectResponse>();
                foreach (var p in pagedProjects.Data)
                {
                    var resp = await MapToResponseAsync(p);
                    resp.CustomerName = customer.Name;
                    responses.Add(resp);
                }

                return Ok(new Pagination<ProjectResponse>(
                    pagedProjects.PageIndex,
                    pagedProjects.PageSize,
                    pagedProjects.Count,
                    responses));
            }

            var customerProjects = await _projectRepo.GetQueryable()
                .Where(p => p.CustomerId == customerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var list = new List<ProjectResponse>();
            foreach (var p in customerProjects)
            {
                var resp = await MapToResponseAsync(p);
                resp.CustomerName = customer.Name;
                list.Add(resp);
            }

            return Ok(list);
        }

        // GET: api/Projects/owner/1
        [HttpGet("owner/{ownerId:int}")]
        public async Task<IActionResult> GetProjectsByOwner(
            int ownerId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var owner = await _userManager.FindByIdAsync(ownerId.ToString());

            if (owner == null)
            {
                return NotFound(new
                {
                    message = "Owner user not found."
                });
            }

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedProjects = await _projectRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    predicate: p => p.OwnerId == ownerId,
                    orderBy: q => q.OrderByDescending(p => p.CreatedAt));

                var responses = new List<ProjectResponse>();
                foreach (var p in pagedProjects.Data)
                {
                    var resp = await MapToResponseAsync(p);
                    resp.OwnerName = owner.FullName;
                    responses.Add(resp);
                }

                return Ok(new Pagination<ProjectResponse>(
                    pagedProjects.PageIndex,
                    pagedProjects.PageSize,
                    pagedProjects.Count,
                    responses));
            }

            var ownerProjects = await _projectRepo.GetQueryable()
                .Where(p => p.OwnerId == ownerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var list = new List<ProjectResponse>();
            foreach (var p in ownerProjects)
            {
                var resp = await MapToResponseAsync(p);
                resp.OwnerName = owner.FullName;
                list.Add(resp);
            }

            return Ok(list);
        }



        // POST: api/Projects
        [HttpPost]
        public async Task<ActionResult<ProjectResponse>> CreateProject(CreateProjectRequest request)
        {
            var owner = await _userManager.FindByIdAsync(request.OwnerId.ToString());

            if (owner == null)
            {
                return BadRequest(new
                {
                    message = "The specified owner user does not exist."
                });
            }

            Customer? customer = null;

            if (request.CustomerId.HasValue)
            {
                customer = await _customerRepo.GetByIdAsync(request.CustomerId.Value);

                if (customer == null)
                {
                    return BadRequest(new
                    {
                        message = "The specified customer does not exist."
                    });
                }
            }

            if (request.DueDate.HasValue &&
                request.StartDate.HasValue &&
                request.DueDate < request.StartDate)
            {
                return BadRequest(new
                {
                    message = "Due date cannot be earlier than start date."
                });
            }

            var project = _mapper.Map<Project>(request);

            await _projectRepo.AddAsync(project);
            await _projectRepo.SaveChangesAsync();

            // Send assignment notification to Lead Developer
            await _notificationService.NotifyProjectAssignmentAsync(project.OwnerId, project.Id, project.Name);

            var response = await MapToResponseAsync(project);

            return CreatedAtAction(
                nameof(GetProject),
                new { id = project.Id },
                response);
        }

        // PUT: api/Projects/5/missed-reason
        [HttpPut("{id:int}/missed-reason")]
        public async Task<IActionResult> SubmitMissedDeadlineReason(int id, [FromBody] SubmitMissedReasonDto dto)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new { message = "Project not found." });
            }

            if (string.IsNullOrWhiteSpace(dto.Reason))
            {
                return BadRequest(new { message = "Reason cannot be empty." });
            }

            project.MissedDeadlineReason = dto.Reason.Trim();
            project.ReasonCategory = string.IsNullOrWhiteSpace(dto.Category) ? "Other" : dto.Category.Trim();
            project.UpdatedAt = DateTime.UtcNow;

            _projectRepo.Update(project);
            await _projectRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Missed deadline reason submitted successfully.",
                projectId = project.Id,
                reasonCategory = project.ReasonCategory,
                missedDeadlineReason = project.MissedDeadlineReason
            });
        }

        // POST: api/Projects/request
        [HttpPost("request")]
        public async Task<ActionResult<ProjectResponse>> SubmitDepartmentRequest([FromBody] CreateDepartmentRequestDto dto)
        {
            var project = new Project
            {
                Name = dto.Name.Trim(),
                Description = dto.Description?.Trim(),
                RequestingDepartment = dto.RequestingDepartment.Trim(),
                RequestedBy = dto.RequestedBy.Trim(),
                BusinessJustification = dto.BusinessJustification?.Trim(),
                DueDate = dto.TargetDeadline,
                Priority = dto.Priority,
                Status = ProjectStatus.Submitted, // Pending Admin Approval
                CreatedAt = DateTime.UtcNow
            };

            await _projectRepo.AddAsync(project);
            await _projectRepo.SaveChangesAsync();

            var response = await MapToResponseAsync(project);
            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, response);
        }

        // GET: api/Projects/requests/pending
        [HttpGet("requests/pending")]
        public async Task<IActionResult> GetPendingDepartmentRequests()
        {
            var requests = await _projectRepo.GetQueryable()
                .Where(p => p.Status == ProjectStatus.Submitted)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = new List<ProjectResponse>();
            foreach (var p in requests)
            {
                result.Add(await MapToResponseAsync(p));
            }

            return Ok(result);
        }

        // PATCH: api/Projects/5/approve
        [HttpPatch("{id:int}/approve")]
        public async Task<IActionResult> ApproveProjectRequest(int id, [FromBody] ApproveProjectRequestDto dto)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new { message = "Project request not found." });
            }

            var owner = await _userManager.FindByIdAsync(dto.OwnerId.ToString());
            if (owner == null)
            {
                return BadRequest(new { message = "The assigned Lead Developer does not exist." });
            }

            project.OwnerId = dto.OwnerId;
            project.Status = ProjectStatus.Working; // Approved and put into Working status
            if (dto.StartDate.HasValue) project.StartDate = dto.StartDate;
            if (dto.DueDate.HasValue) project.DueDate = dto.DueDate;
            if (dto.Priority.HasValue) project.Priority = dto.Priority.Value;
            project.UpdatedAt = DateTime.UtcNow;

            _projectRepo.Update(project);
            await _projectRepo.SaveChangesAsync();

            await _notificationService.NotifyProjectAssignmentAsync(project.OwnerId, project.Id, project.Name);

            return Ok(new
            {
                message = "Project request approved and assigned successfully.",
                projectId = project.Id,
                assignedLeadDeveloper = owner.FullName,
                status = project.Status
            });
        }

        // PATCH: api/Projects/5/reject
        [HttpPatch("{id:int}/reject")]
        public async Task<IActionResult> RejectProjectRequest(int id, [FromBody] RejectProjectRequestDto dto)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new { message = "Project request not found." });
            }

            project.Status = ProjectStatus.Rejected;
            project.RejectionReason = dto.RejectionReason.Trim();
            project.UpdatedAt = DateTime.UtcNow;

            _projectRepo.Update(project);
            await _projectRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Project request rejected.",
                projectId = project.Id,
                rejectionReason = project.RejectionReason
            });
        }

        // GET: api/Projects/overdue
        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdueProjects()
        {
            var now = DateTime.UtcNow;
            var overdueProjects = await _projectRepo.GetQueryable()
                .Where(p => (p.DueDate.HasValue && p.DueDate < now && p.Status != ProjectStatus.Finished) || p.Status == ProjectStatus.Overdue)
                .OrderByDescending(p => p.DueDate)
                .ToListAsync();

            var result = new List<ProjectResponse>();
            foreach (var p in overdueProjects)
            {
                result.Add(await MapToResponseAsync(p));
            }

            return Ok(result);
        }

        // GET: api/Projects/department/HR
        [HttpGet("department/{departmentName}")]
        public async Task<IActionResult> GetProjectsByDepartment(string departmentName)
        {
            var dept = departmentName.Trim();
            var projects = await _projectRepo.GetQueryable()
                .Where(p => p.RequestingDepartment != null && p.RequestingDepartment.ToLower() == dept.ToLower())
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();

            var result = new List<ProjectResponse>();
            foreach (var p in projects)
            {
                result.Add(await MapToResponseAsync(p));
            }

            return Ok(result);
        }

        // PUT: api/Projects/5
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateProject(int id, UpdateProjectRequest request)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            var owner = await _userManager.FindByIdAsync(request.OwnerId.ToString());

            if (owner == null)
            {
                return BadRequest(new
                {
                    message = "The specified owner user does not exist."
                });
            }

            if (request.CustomerId.HasValue)
            {
                var customerExists = await _customerRepo.GetByIdAsync(request.CustomerId.Value);

                if (customerExists == null)
                {
                    return BadRequest(new
                    {
                        message = "The specified customer does not exist."
                    });
                }
            }

            if (request.DueDate.HasValue &&
                request.StartDate.HasValue &&
                request.DueDate < request.StartDate)
            {
                return BadRequest(new
                {
                    message = "Due date cannot be earlier than start date."
                });
            }

            var previousOwnerId = project.OwnerId;

            _mapper.Map(request, project);

            _projectRepo.Update(project);
            await _projectRepo.SaveChangesAsync();

            if (previousOwnerId != project.OwnerId)
            {
                await _notificationService.NotifyProjectAssignmentAsync(project.OwnerId, project.Id, project.Name);
            }

            return Ok(new
            {
                message = "Project updated successfully."
            });
        }

        // DELETE: api/Projects/5
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _projectRepo.GetByIdAsync(id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            _projectRepo.Delete(project);
            await _projectRepo.SaveChangesAsync();

            return Ok(new
            {
                message = "Project deleted successfully."
            });
        }
    }
}
