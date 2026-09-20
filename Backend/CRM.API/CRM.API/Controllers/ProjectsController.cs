using CRM.API.Data;
using CRM.API.DTOs.Project;
using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AccessControlService _access;
        private readonly ActivityLogger _activityLogger;
        private readonly WorkspaceNotificationService _notifications;

        public ProjectsController(
            ApplicationDbContext context,
            AccessControlService access,
            ActivityLogger activityLogger,
            WorkspaceNotificationService notifications)
        {
            _context = context;
            _access = access;
            _activityLogger = activityLogger;
            _notifications = notifications;
        }

        // =========================================================
        // GET: api/Projects
        // Get all projects
        // =========================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectResponse>>> GetProjects()
        {
            var query = _context.Projects
                .AsNoTracking()
                .AsQueryable();

            if (!AccessControlService.IsManagementUser(User))
            {
                var userId = AccessControlService.GetUserId(User);
                if (userId == null) return Unauthorized(new { message = "Authenticated user could not be determined." });

                query = query.Where(project =>
                    project.OwnerId == userId.Value ||
                    project.Members.Any(member => member.UserId == userId.Value) ||
                    (project.TeamId != null && project.Team != null &&
                     project.Team.Members.Any(member => member.UserId == userId.Value)) ||
                    project.Tasks.Any(task => task.Assignees.Any(assignment => assignment.UserId == userId.Value)));
            }

            var projects = await query
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    Priority = p.Priority,

                    StartDate = p.StartDate,
                    DueDate = p.DueDate,

                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    OwnerId = p.OwnerId,
                    OwnerName = p.Owner.FullName,
                    RequestedById = p.RequestedById,
                    RequestedByName = p.RequestedBy != null ? p.RequestedBy.FullName : null,

                    CustomerId = p.Customer != null && p.Customer.Type == "Department"
                        ? p.CustomerId
                        : null,
                    CustomerName = p.Customer != null && p.Customer.Type == "Department"
                        ? p.Customer.Name
                        : null,
                    TeamId = p.TeamId,
                    TeamName = p.Team != null ? p.Team.Name : null
                })
                .ToListAsync();

            return Ok(projects);
        }

        // =========================================================
        // GET: api/Projects/5
        // Get project by ID
        // =========================================================

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProjectResponse>> GetProject(int id)
        {
            var exists = await _context.Projects
                .AsNoTracking()
                .AnyAsync(p => p.Id == id);

            if (!exists)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (!await _access.CanAccessProjectAsync(User, id))
            {
                return Forbid();
            }

            var project = await _context.Projects
                .AsNoTracking()
                .Include(p => p.Owner)
                .Include(p => p.Customer)
                .Where(p => p.Id == id)
                .Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    Priority = p.Priority,

                    StartDate = p.StartDate,
                    DueDate = p.DueDate,

                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    OwnerId = p.OwnerId,
                    OwnerName = p.Owner.FullName,
                    RequestedById = p.RequestedById,
                    RequestedByName = p.RequestedBy != null ? p.RequestedBy.FullName : null,

                    CustomerId = p.Customer != null && p.Customer.Type == "Department"
                        ? p.CustomerId
                        : null,
                    CustomerName = p.Customer != null && p.Customer.Type == "Department"
                        ? p.Customer.Name
                        : null,
                    TeamId = p.TeamId,
                    TeamName = p.Team != null ? p.Team.Name : null
                })
                .FirstOrDefaultAsync();

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            return Ok(project);
        }

        // =========================================================
        // GET: api/Projects/customer/1
        // Get projects for a specific customer
        // =========================================================

        [HttpGet("customer/{customerId:int}")]
        [HttpGet("organization/{customerId:int}")]
        [HttpGet("department/{customerId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<ProjectResponse>>>
            GetProjectsByCustomer(int customerId)
        {
            var customerExists = await _context.Customers
                .AnyAsync(c => c.Id == customerId && c.Type == "Department");

            if (!customerExists)
            {
                return NotFound(new
                {
                    message = "Department not found."
                });
            }

            var projects = await _context.Projects
                .AsNoTracking()
                .Include(p => p.Owner)
                .Include(p => p.Customer)
                .Where(p => p.CustomerId == customerId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    Priority = p.Priority,

                    StartDate = p.StartDate,
                    DueDate = p.DueDate,

                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    OwnerId = p.OwnerId,
                    OwnerName = p.Owner.FullName,
                    RequestedById = p.RequestedById,
                    RequestedByName = p.RequestedBy != null ? p.RequestedBy.FullName : null,

                    CustomerId = p.Customer != null && p.Customer.Type == "Department"
                        ? p.CustomerId
                        : null,
                    CustomerName = p.Customer != null && p.Customer.Type == "Department"
                        ? p.Customer.Name
                        : null,
                    TeamId = p.TeamId,
                    TeamName = p.Team != null ? p.Team.Name : null
                })
                .ToListAsync();

            return Ok(projects);
        }

        // =========================================================
        // GET: api/Projects/owner/1
        // Get projects owned by a specific user
        // =========================================================

        [HttpGet("owner/{ownerId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<ProjectResponse>>>
            GetProjectsByOwner(int ownerId)
        {
            var ownerExists = await _context.Users
                .AnyAsync(u => u.Id == ownerId);

            if (!ownerExists)
            {
                return NotFound(new
                {
                    message = "Owner user not found."
                });
            }

            var projects = await _context.Projects
                .AsNoTracking()
                .Include(p => p.Owner)
                .Include(p => p.Customer)
                .Where(p => p.OwnerId == ownerId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    Priority = p.Priority,

                    StartDate = p.StartDate,
                    DueDate = p.DueDate,

                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    OwnerId = p.OwnerId,
                    OwnerName = p.Owner.FullName,
                    RequestedById = p.RequestedById,
                    RequestedByName = p.RequestedBy != null ? p.RequestedBy.FullName : null,

                    CustomerId = p.Customer != null && p.Customer.Type == "Department"
                        ? p.CustomerId
                        : null,
                    CustomerName = p.Customer != null && p.Customer.Type == "Department"
                        ? p.Customer.Name
                        : null,
                    TeamId = p.TeamId,
                    TeamName = p.Team != null ? p.Team.Name : null
                })
                .ToListAsync();

            return Ok(projects);
        }

        // =========================================================
        // GET: api/Projects/search?search=Website
        // Search projects
        // =========================================================

        [HttpGet("search")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<IEnumerable<ProjectResponse>>>
            SearchProjects([FromQuery] string search)
        {
            if (string.IsNullOrWhiteSpace(search))
            {
                return BadRequest(new
                {
                    message = "Search term is required."
                });
            }

            search = search.Trim();

            var projects = await _context.Projects
                .AsNoTracking()
                .Include(p => p.Owner)
                .Include(p => p.Customer)
                .Where(p =>
                    p.Name.Contains(search) ||

                    (p.Description != null &&
                     p.Description.Contains(search)) ||

                    p.Status.Contains(search) ||

                    p.Priority.Contains(search) ||

                    p.Owner.FullName.Contains(search) ||

                    (p.Customer != null &&
                     p.Customer.Name.Contains(search)))
                .OrderBy(p => p.Name)
                .Select(p => new ProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Status = p.Status,
                    Priority = p.Priority,

                    StartDate = p.StartDate,
                    DueDate = p.DueDate,

                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,

                    OwnerId = p.OwnerId,
                    OwnerName = p.Owner.FullName,
                    RequestedById = p.RequestedById,
                    RequestedByName = p.RequestedBy != null ? p.RequestedBy.FullName : null,

                    CustomerId = p.Customer != null && p.Customer.Type == "Department"
                        ? p.CustomerId
                        : null,
                    CustomerName = p.Customer != null && p.Customer.Type == "Department"
                        ? p.Customer.Name
                        : null,
                    TeamId = p.TeamId,
                    TeamName = p.Team != null ? p.Team.Name : null
                })
                .ToListAsync();

            return Ok(projects);
        }

        // =========================================================
        // POST: api/Projects
        // Create project
        // =========================================================

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProjectResponse>> CreateProject(CreateProjectRequest request)
        {
            var currentUserId = AccessControlService.GetUserId(User);
            if (!currentUserId.HasValue)
                return Unauthorized(new { message = "Authenticated user could not be determined." });

            var ownerId = request.OwnerId > 0 ? request.OwnerId : currentUserId.Value;
            var owner = await _context.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == ownerId && u.IsActive);

            if (owner == null)
                return BadRequest(new { message = "The specified owner user does not exist or is inactive." });

            Customer? department = null;
            if (request.CustomerId.HasValue)
            {
                department = await _context.Customers.AsNoTracking()
                    .FirstOrDefaultAsync(c =>
                        c.Id == request.CustomerId.Value && c.Type == "Department");

                if (department == null)
                    return BadRequest(new { message = "The specified department does not exist." });
            }

            Team? team = null;
            if (request.TeamId.HasValue)
            {
                team = await _context.Teams.AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == request.TeamId.Value);

                if (team == null)
                    return BadRequest(new { message = "The specified team does not exist." });
            }

            if (request.DueDate.HasValue && request.StartDate.HasValue && request.DueDate < request.StartDate)
                return BadRequest(new { message = "Due date cannot be earlier than start date." });

            var project = new Project
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                Status = request.Status.Trim(),
                Priority = request.Priority.Trim(),
                StartDate = request.StartDate,
                DueDate = request.DueDate,
                OwnerId = ownerId,
                RequestedById = null,
                CustomerId = request.CustomerId,
                TeamId = request.TeamId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            _activityLogger.Add(
                currentUserId.Value,
                "Project",
                project.Id,
                "Project created",
                team == null
                    ? $"Created project '{project.Name}'."
                    : $"Created project '{project.Name}' for team '{team.Name}'.");

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, new ProjectResponse
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description,
                Status = project.Status,
                Priority = project.Priority,
                StartDate = project.StartDate,
                DueDate = project.DueDate,
                CreatedAt = project.CreatedAt,
                UpdatedAt = project.UpdatedAt,
                OwnerId = project.OwnerId,
                OwnerName = owner.FullName,
                RequestedById = null,
                RequestedByName = null,
                CustomerId = project.CustomerId,
                CustomerName = department?.Name,
                TeamId = project.TeamId,
                TeamName = team?.Name
            });
        }

        // =========================================================
        // PUT: api/Projects/5
        // Update project
        // =========================================================

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProject(
            int id,
            UpdateProjectRequest request)
        {
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            // -----------------------------------------------------
            // Check Owner
            // -----------------------------------------------------

            var ownerExists = await _context.Users
                .AnyAsync(u => u.Id == request.OwnerId);

            if (!ownerExists)
            {
                return BadRequest(new
                {
                    message = "The specified owner user does not exist."
                });
            }

            // -----------------------------------------------------
            // Check Customer if provided
            // -----------------------------------------------------

            if (request.CustomerId.HasValue)
            {
                var customerExists = await _context.Customers
                    .AnyAsync(
                        c => c.Id == request.CustomerId.Value &&
                             c.Type == "Department");

                if (!customerExists)
                {
                    return BadRequest(new
                    {
                        message =
                            "The specified department does not exist."
                    });
                }
            }

            // -----------------------------------------------------
            // Check Team if provided
            // -----------------------------------------------------

            if (request.TeamId.HasValue)
            {
                var teamExists = await _context.Teams
                    .AnyAsync(t => t.Id == request.TeamId.Value);

                if (!teamExists)
                {
                    return BadRequest(new
                    {
                        message = "The specified team does not exist."
                    });
                }
            }

            // -----------------------------------------------------
            // Validate dates
            // -----------------------------------------------------

            if (request.DueDate.HasValue &&
                request.StartDate.HasValue &&
                request.DueDate < request.StartDate)
            {
                return BadRequest(new
                {
                    message =
                        "Due date cannot be earlier than start date."
                });
            }

            // -----------------------------------------------------
            // Update
            // -----------------------------------------------------

            project.Name = request.Name.Trim();

            project.Description = request.Description?.Trim();

            project.Status = request.Status.Trim();

            project.Priority = request.Priority.Trim();

            project.StartDate = request.StartDate;

            project.DueDate = request.DueDate;

            project.OwnerId = request.OwnerId;

            project.CustomerId = request.CustomerId;

            project.TeamId = request.TeamId;

            project.UpdatedAt = DateTime.UtcNow;

            var currentUserId = AccessControlService.GetUserId(User);
            if (currentUserId.HasValue)
            {
                _activityLogger.Add(
                    currentUserId.Value,
                    "Project",
                    project.Id,
                    "Project updated",
                    $"Updated project '{project.Name}'.");
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Project updated successfully."
            });
        }

        // =========================================================
        // DELETE: api/Projects/5
        // Delete project
        // =========================================================

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            var currentUserId = AccessControlService.GetUserId(User);
            if (currentUserId.HasValue)
            {
                _activityLogger.Add(
                    currentUserId.Value,
                    "Project",
                    project.Id,
                    "Project deleted",
                    $"Deleted project '{project.Name}'.");
            }

            _context.Projects.Remove(project);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Project deleted successfully."
            });
        }
    }
}