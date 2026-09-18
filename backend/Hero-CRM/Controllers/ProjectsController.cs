using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
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
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [Authorize]
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

        private int CurrentUserId
        {
            get
            {
                var claimVal = User.FindFirstValue(ClaimTypes.NameIdentifier)
                            ?? User.FindFirst("nameid")?.Value
                            ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                            ?? User.FindFirst("sub")?.Value
                            ?? User.FindFirst(ClaimTypes.Name)?.Value;
                return int.TryParse(claimVal, out var id) ? id : 0;
            }
        }

        private bool IsAdmin =>
            User.IsInRole("Admin")
            || User.HasClaim(ClaimTypes.Role, "Admin")
            || User.HasClaim("role", "Admin")
            || User.HasClaim("http://schemas.microsoft.com/ws/2008/06/identity/claims/role", "Admin");

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
            var query = _projectRepo.GetQueryable();

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                query = query.Where(p =>
                    p.OwnerId == userId ||
                    p.Members.Any(m => m.UserId == userId) ||
                    p.Tasks.Any(t => t.Assignees.Any(a => a.UserId == userId)));
            }

            if (pageIndex.HasValue || pageSize.HasValue || !string.IsNullOrWhiteSpace(search) || status.HasValue)
            {
                var s = search?.Trim();

                if (!string.IsNullOrWhiteSpace(s))
                {
                    query = query.Where(p =>
                        p.Name.Contains(s) ||
                        (p.Description != null && p.Description.Contains(s)));
                }

                if (status.HasValue)
                {
                    query = query.Where(p => p.Status == status.Value);
                }

                var totalCount = await query.CountAsync();
                var pagedProjects = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip(((pageIndex ?? 1) - 1) * (pageSize ?? 20))
                    .Take(pageSize ?? 20)
                    .ToListAsync();

                var responses = new List<ProjectResponse>();
                foreach (var p in pagedProjects)
                {
                    responses.Add(await MapToResponseAsync(p));
                }

                return Ok(new Pagination<ProjectResponse>(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    totalCount,
                    responses));
            }

            var projects = await query
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

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                var isAssigned = await _projectRepo.GetQueryable()
                    .Where(p => p.Id == id && (
                        p.OwnerId == userId ||
                        p.Members.Any(m => m.UserId == userId) ||
                        p.Tasks.Any(t => t.Assignees.Any(a => a.UserId == userId))))
                    .AnyAsync();

                if (!isAssigned)
                {
                    return Forbid();
                }
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
            if (!IsAdmin && ownerId != CurrentUserId)
            {
                return Forbid();
            }

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
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<ProjectResponse>> CreateProject([FromBody] CreateProjectRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var owner = await _userManager.FindByIdAsync(request.OwnerId.ToString());

            if (owner == null)
            {
                return BadRequest(new
                {
                    message = "Owner user not found."
                });
            }

            if (request.CustomerId.HasValue)
            {
                var customer = await _customerRepo.GetByIdAsync(request.CustomerId.Value);

                if (customer == null)
                {
                    return BadRequest(new
                    {
                        message = "Customer not found."
                    });
                }
            }

            var project = _mapper.Map<Project>(request);
            project.CreatedAt = DateTime.UtcNow;

            await _projectRepo.AddAsync(project);
            await _projectRepo.SaveChangesAsync();

            // Notify project owner
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
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                var isAssigned = await _projectRepo.GetQueryable()
                    .Where(p => p.Id == id && (
                        p.OwnerId == userId ||
                        p.Members.Any(m => m.UserId == userId) ||
                        p.Tasks.Any(t => t.Assignees.Any(a => a.UserId == userId))))
                    .AnyAsync();

                if (!isAssigned)
                {
                    return Forbid();
                }
            }

            project.MissedDeadlineReason = dto.Reason;
            project.ReasonCategory = dto.Category;
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



        // GET: api/Projects/overdue
        [HttpGet("overdue")]
        public async Task<IActionResult> GetOverdueProjects()
        {
            var now = DateTime.UtcNow;
            var query = _projectRepo.GetQueryable()
                .Where(p => (p.DueDate.HasValue && p.DueDate < now && p.Status != ProjectStatus.Finished) || p.Status == ProjectStatus.Overdue);

            if (!IsAdmin)
            {
                var userId = CurrentUserId;
                query = query.Where(p =>
                    p.OwnerId == userId ||
                    p.Members.Any(m => m.UserId == userId) ||
                    p.Tasks.Any(t => t.Assignees.Any(a => a.UserId == userId)));
            }

            var overdueProjects = await query
                .OrderByDescending(p => p.DueDate)
                .ToListAsync();

            var result = new List<ProjectResponse>();
            foreach (var p in overdueProjects)
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

            if (!IsAdmin && project.OwnerId != CurrentUserId)
            {
                return Forbid();
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
        [Authorize(Roles = "Admin")]
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
