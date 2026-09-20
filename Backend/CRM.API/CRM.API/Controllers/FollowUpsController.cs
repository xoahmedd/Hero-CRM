using CRM.API.Data;
using CRM.API.DTOs.FollowUp;
using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/followups")]
    [Authorize]
    public class FollowUpsController : ControllerBase
    {
        private const string DepartmentType = "Department";

        private static readonly string[] AllowedTypes =
        [
            "FollowUp",
            "Call",
            "Email",
            "Meeting",
            "CheckIn"
        ];

        private static readonly string[] AllowedStatuses =
        [
            "Open",
            "Completed",
            "Cancelled"
        ];

        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;
        private readonly WorkspaceNotificationService _notifications;

        public FollowUpsController(
            ApplicationDbContext context,
            ActivityLogger activityLogger,
            WorkspaceNotificationService notifications)
        {
            _context = context;
            _activityLogger = activityLogger;
            _notifications = notifications;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FollowUpResponse>>> GetFollowUps(
            [FromQuery] string? status = null,
            [FromQuery] string? scope = null,
            [FromQuery] int? ownerId = null,
            [FromQuery] int? contactId = null,
            [FromQuery] int? departmentId = null,
            [FromQuery] int? projectId = null,
            [FromQuery] string? search = null)
        {
            var currentUserId = AccessControlService.GetUserId(User);
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var query = _context.FollowUps.AsNoTracking().AsQueryable();

            if (!AccessControlService.IsManagementUser(User))
            {
                query = query.Where(f => f.OwnerId == currentUserId.Value);
            }
            else if (ownerId.HasValue)
            {
                query = query.Where(f => f.OwnerId == ownerId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status) &&
                !status.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                var normalizedStatus = NormalizeChoice(status, AllowedStatuses);
                if (normalizedStatus == null)
                {
                    return BadRequest(new { message = "Status must be Open, Completed, Cancelled, or All." });
                }

                query = query.Where(f => f.Status == normalizedStatus);
            }

            if (contactId.HasValue)
            {
                query = query.Where(f => f.ContactId == contactId.Value);
            }

            if (departmentId.HasValue)
            {
                query = query.Where(f => f.DepartmentId == departmentId.Value);
            }

            if (projectId.HasValue)
            {
                query = query.Where(f => f.ProjectId == projectId.Value);
            }

            var now = DateTime.UtcNow;
            var today = now.Date;
            var tomorrow = today.AddDays(1);

            switch (scope?.Trim().ToLowerInvariant())
            {
                case "overdue":
                    query = query.Where(f => f.Status == "Open" && f.DueAt < now);
                    break;
                case "today":
                    query = query.Where(f => f.Status == "Open" && f.DueAt >= today && f.DueAt < tomorrow);
                    break;
                case "upcoming":
                    query = query.Where(f => f.Status == "Open" && f.DueAt >= tomorrow);
                    break;
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(f =>
                    f.Title.Contains(term) ||
                    (f.Description != null && f.Description.Contains(term)) ||
                    (f.Outcome != null && f.Outcome.Contains(term)) ||
                    f.Owner.FullName.Contains(term) ||
                    (f.Contact != null && f.Contact.Name.Contains(term)) ||
                    (f.Department != null && f.Department.Name.Contains(term)) ||
                    (f.Project != null && f.Project.Name.Contains(term)));
            }

            var result = await ProjectResponse(query)
                .OrderBy(f => f.Status == "Open" ? 0 : 1)
                .ThenBy(f => f.DueAt)
                .ThenByDescending(f => f.Id)
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<FollowUpResponse>> GetFollowUp(int id)
        {
            var currentUserId = AccessControlService.GetUserId(User);
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var query = _context.FollowUps.AsNoTracking().Where(f => f.Id == id);
            if (!AccessControlService.IsManagementUser(User))
            {
                query = query.Where(f => f.OwnerId == currentUserId.Value);
            }

            var result = await ProjectResponse(query).FirstOrDefaultAsync();
            return result == null
                ? NotFound(new { message = "Follow-up not found." })
                : Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<FollowUpResponse>> CreateFollowUp(CreateFollowUpRequest request)
        {
            var validation = await ValidateRequestAsync(request);
            if (validation != null)
            {
                return BadRequest(new { message = validation });
            }

            var actorUserId = AccessControlService.GetUserId(User);
            if (actorUserId == null)
            {
                return Unauthorized();
            }

            var type = NormalizeChoice(request.Type, AllowedTypes)!;
            var followUp = new FollowUp
            {
                Title = request.Title.Trim(),
                Type = type,
                Status = "Open",
                Description = NormalizeOptional(request.Description),
                OwnerId = request.OwnerId,
                DueAt = request.DueAt,
                ContactId = request.ContactId,
                DepartmentId = request.DepartmentId,
                ProjectId = request.ProjectId,
                CreatedAt = DateTime.UtcNow
            };

            _context.FollowUps.Add(followUp);
            await _context.SaveChangesAsync();

            AddTargetActivities(actorUserId.Value, followUp, "Follow-up created", followUp.Title);
            _activityLogger.Add(actorUserId.Value, "FollowUp", followUp.Id, "Follow-up created", followUp.Title);

            if (followUp.OwnerId != actorUserId.Value)
            {
                _notifications.Add(
                    followUp.OwnerId,
                    "New CRM follow-up",
                    $"'{followUp.Title}' is due {followUp.DueAt:MMM d, yyyy h:mm tt} UTC.",
                    "FollowUp");
            }

            await _context.SaveChangesAsync();

            var response = await ProjectResponse(
                    _context.FollowUps.AsNoTracking().Where(f => f.Id == followUp.Id))
                .FirstAsync();

            return CreatedAtAction(nameof(GetFollowUp), new { id = followUp.Id }, response);
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<FollowUpResponse>> UpdateFollowUp(
            int id,
            UpdateFollowUpRequest request)
        {
            var followUp = await _context.FollowUps.FirstOrDefaultAsync(f => f.Id == id);
            if (followUp == null)
            {
                return NotFound(new { message = "Follow-up not found." });
            }

            var validation = await ValidateRequestAsync(request);
            if (validation != null)
            {
                return BadRequest(new { message = validation });
            }

            var status = NormalizeChoice(request.Status, AllowedStatuses);
            if (status == null)
            {
                return BadRequest(new { message = "Status must be Open, Completed, or Cancelled." });
            }

            var actorUserId = AccessControlService.GetUserId(User);
            if (actorUserId == null)
            {
                return Unauthorized();
            }

            var previousOwnerId = followUp.OwnerId;

            followUp.Title = request.Title.Trim();
            followUp.Type = NormalizeChoice(request.Type, AllowedTypes)!;
            followUp.Status = status;
            followUp.Description = NormalizeOptional(request.Description);
            followUp.OwnerId = request.OwnerId;
            followUp.DueAt = request.DueAt;
            followUp.ContactId = request.ContactId;
            followUp.DepartmentId = request.DepartmentId;
            followUp.ProjectId = request.ProjectId;
            followUp.Outcome = NormalizeOptional(request.Outcome);
            followUp.CompletedAt = status == "Completed"
                ? followUp.CompletedAt ?? DateTime.UtcNow
                : null;
            followUp.UpdatedAt = DateTime.UtcNow;

            _activityLogger.Add(actorUserId.Value, "FollowUp", followUp.Id, "Follow-up updated", followUp.Title);
            AddTargetActivities(actorUserId.Value, followUp, "Follow-up updated", followUp.Title);

            if (previousOwnerId != followUp.OwnerId && followUp.OwnerId != actorUserId.Value)
            {
                _notifications.Add(
                    followUp.OwnerId,
                    "CRM follow-up assigned",
                    $"'{followUp.Title}' was assigned to you and is due {followUp.DueAt:MMM d, yyyy h:mm tt} UTC.",
                    "FollowUp");
            }

            await _context.SaveChangesAsync();

            var response = await ProjectResponse(
                    _context.FollowUps.AsNoTracking().Where(f => f.Id == followUp.Id))
                .FirstAsync();
            return Ok(response);
        }

        [HttpPost("{id:int}/complete")]
        public async Task<ActionResult<FollowUpResponse>> CompleteFollowUp(
            int id,
            CompleteFollowUpRequest request)
        {
            var currentUserId = AccessControlService.GetUserId(User);
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var followUp = await _context.FollowUps.FirstOrDefaultAsync(f => f.Id == id);
            if (followUp == null)
            {
                return NotFound(new { message = "Follow-up not found." });
            }

            if (!AccessControlService.IsManagementUser(User) && followUp.OwnerId != currentUserId.Value)
            {
                return Forbid();
            }

            followUp.Status = "Completed";
            followUp.Outcome = NormalizeOptional(request.Outcome);
            followUp.CompletedAt = DateTime.UtcNow;
            followUp.UpdatedAt = DateTime.UtcNow;

            _activityLogger.Add(currentUserId.Value, "FollowUp", followUp.Id, "Follow-up completed", followUp.Title);
            AddTargetActivities(currentUserId.Value, followUp, "Follow-up completed", followUp.Title);
            await _context.SaveChangesAsync();

            var response = await ProjectResponse(
                    _context.FollowUps.AsNoTracking().Where(f => f.Id == followUp.Id))
                .FirstAsync();
            return Ok(response);
        }

        [HttpPost("{id:int}/reopen")]
        public async Task<ActionResult<FollowUpResponse>> ReopenFollowUp(int id)
        {
            var currentUserId = AccessControlService.GetUserId(User);
            if (currentUserId == null)
            {
                return Unauthorized();
            }

            var followUp = await _context.FollowUps.FirstOrDefaultAsync(f => f.Id == id);
            if (followUp == null)
            {
                return NotFound(new { message = "Follow-up not found." });
            }

            if (!AccessControlService.IsManagementUser(User) && followUp.OwnerId != currentUserId.Value)
            {
                return Forbid();
            }

            followUp.Status = "Open";
            followUp.CompletedAt = null;
            followUp.UpdatedAt = DateTime.UtcNow;

            _activityLogger.Add(currentUserId.Value, "FollowUp", followUp.Id, "Follow-up reopened", followUp.Title);
            AddTargetActivities(currentUserId.Value, followUp, "Follow-up reopened", followUp.Title);
            await _context.SaveChangesAsync();

            var response = await ProjectResponse(
                    _context.FollowUps.AsNoTracking().Where(f => f.Id == followUp.Id))
                .FirstAsync();
            return Ok(response);
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteFollowUp(int id)
        {
            var followUp = await _context.FollowUps.FirstOrDefaultAsync(f => f.Id == id);
            if (followUp == null)
            {
                return NotFound(new { message = "Follow-up not found." });
            }

            var actorUserId = AccessControlService.GetUserId(User);
            if (actorUserId == null)
            {
                return Unauthorized();
            }

            AddTargetActivities(actorUserId.Value, followUp, "Follow-up removed", followUp.Title);
            _context.FollowUps.Remove(followUp);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Follow-up deleted successfully." });
        }

        private async Task<string?> ValidateRequestAsync(CreateFollowUpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                return "Title is required.";
            }

            if (NormalizeChoice(request.Type, AllowedTypes) == null)
            {
                return "Type must be FollowUp, Call, Email, Meeting, or CheckIn.";
            }

            if (request.DueAt == default)
            {
                return "Due date is required.";
            }

            if (request.ContactId == null && request.DepartmentId == null && request.ProjectId == null)
            {
                return "Link the follow-up to a person, department, or project.";
            }

            if (!await _context.Users.AsNoTracking().AnyAsync(u => u.Id == request.OwnerId && u.IsActive))
            {
                return "Owner user not found or inactive.";
            }

            if (request.ContactId.HasValue &&
                !await _context.Contacts.AsNoTracking().AnyAsync(c =>
                    c.Id == request.ContactId.Value && c.Organization.Type == DepartmentType))
            {
                return "Person not found.";
            }

            if (request.DepartmentId.HasValue &&
                !await _context.Customers.AsNoTracking().AnyAsync(d =>
                    d.Id == request.DepartmentId.Value && d.Type == DepartmentType))
            {
                return "Department not found.";
            }

            if (request.ProjectId.HasValue &&
                !await _context.Projects.AsNoTracking().AnyAsync(p => p.Id == request.ProjectId.Value))
            {
                return "Project not found.";
            }

            return null;
        }

        private void AddTargetActivities(
            int actorUserId,
            FollowUp followUp,
            string action,
            string description)
        {
            if (followUp.ContactId.HasValue)
            {
                _activityLogger.Add(actorUserId, "Person", followUp.ContactId.Value, action, description);
            }

            if (followUp.DepartmentId.HasValue)
            {
                _activityLogger.Add(actorUserId, "Department", followUp.DepartmentId.Value, action, description);
            }

            if (followUp.ProjectId.HasValue)
            {
                _activityLogger.Add(actorUserId, "Project", followUp.ProjectId.Value, action, description);
            }
        }

        private static IQueryable<FollowUpResponse> ProjectResponse(IQueryable<FollowUp> query)
        {
            return query.Select(f => new FollowUpResponse
            {
                Id = f.Id,
                Title = f.Title,
                Type = f.Type,
                Status = f.Status,
                Description = f.Description,
                OwnerId = f.OwnerId,
                OwnerName = f.Owner.FullName,
                DueAt = f.DueAt,
                Outcome = f.Outcome,
                CompletedAt = f.CompletedAt,
                ContactId = f.ContactId,
                ContactName = f.Contact != null ? f.Contact.Name : null,
                DepartmentId = f.DepartmentId,
                DepartmentName = f.Department != null ? f.Department.Name : null,
                ProjectId = f.ProjectId,
                ProjectName = f.Project != null ? f.Project.Name : null,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt
            });
        }

        private static string? NormalizeChoice(string? value, IEnumerable<string> allowed)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return allowed.FirstOrDefault(item =>
                item.Equals(value.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        private static string? NormalizeOptional(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }
    }
}
