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
    [Route("api/Projects/{projectId:int}/members")]
    [Authorize]
    public class ProjectMembersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AccessControlService _access;
        private readonly ActivityLogger _activityLogger;
        private readonly WorkspaceNotificationService _notifications;

        public ProjectMembersController(
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
        // GET: api/Projects/1/members
        // Get all explicit members of a project.
        // The project owner is stored separately on Project.OwnerId.
        // =========================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectMemberResponse>>>
            GetMembers(int projectId)
        {
            var projectExists = await _context.Projects
                .AsNoTracking()
                .AnyAsync(p => p.Id == projectId);

            if (!projectExists)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (!await _access.CanAccessProjectAsync(User, projectId))
            {
                return Forbid();
            }

            var members = await _context.ProjectMembers
                .AsNoTracking()
                .Where(pm => pm.ProjectId == projectId)
                .OrderBy(pm => pm.JoinedAt)
                .Select(pm => new ProjectMemberResponse
                {
                    ProjectId = pm.ProjectId,
                    UserId = pm.UserId,
                    FullName = pm.User.FullName,
                    Email = pm.User.Email,
                    ProfileImage = pm.User.ProfileImage,
                    JoinedAt = pm.JoinedAt
                })
                .ToListAsync();

            return Ok(members);
        }

        // =========================================================
        // POST: api/Projects/1/members/2
        // Add an active user to a project.
        // =========================================================

        [HttpPost("{userId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddMember(
            int projectId,
            int userId)
        {
            var project = await _context.Projects
                .AsNoTracking()
                .Where(p => p.Id == projectId)
                .Select(p => new
                {
                    p.Id,
                    p.Name,
                    p.OwnerId,
                    p.TeamId
                })
                .FirstOrDefaultAsync();

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (project.OwnerId == userId)
            {
                return Conflict(new
                {
                    message = "The project owner is already part of this project."
                });
            }

            var memberUser = await _context.Users
                .AsNoTracking()
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            if (memberUser == null)
                return NotFound(new { message = "User not found or inactive." });

            if (!memberUser.UserRoles.Any(ur =>
                    ur.Role.Name == "User" || ur.Role.Name == "Developer"))
                return BadRequest(new { message = "Only User accounts can be assigned to projects." });

            if (project.TeamId.HasValue)
            {
                var isTeamMember = await _context.TeamMembers.AnyAsync(tm =>
                    tm.TeamId == project.TeamId.Value &&
                    tm.UserId == userId);

                if (!isTeamMember)
                    return BadRequest(new { message = "This user is not a member of the project's assigned team." });
            }

            var alreadyMember = await _context.ProjectMembers
                .AnyAsync(pm =>
                    pm.ProjectId == projectId &&
                    pm.UserId == userId);

            if (alreadyMember)
            {
                return Conflict(new
                {
                    message = "User is already a member of this project."
                });
            }

            _context.ProjectMembers.Add(new ProjectMember
            {
                ProjectId = projectId,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });

            var currentUserId = AccessControlService.GetUserId(User);
            if (currentUserId.HasValue)
            {
                _activityLogger.Add(
                    currentUserId.Value,
                    "Project",
                    projectId,
                    "Project member added",
                    $"Added {memberUser.FullName} to the project.");
            }

            if (currentUserId != userId)
            {
                _notifications.Add(
                    userId,
                    "Added to project",
                    $"You were added to project '{project.Name}'.",
                    "Project");
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User added to project successfully."
            });
        }

        // =========================================================
        // DELETE: api/Projects/1/members/2
        // Remove an explicit member from a project.
        // =========================================================

        [HttpDelete("{userId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveMember(
            int projectId,
            int userId)
        {
            var projectExists = await _context.Projects
                .AsNoTracking()
                .AnyAsync(p => p.Id == projectId);

            if (!projectExists)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            var member = await _context.ProjectMembers
                .Include(pm => pm.User)
                .FirstOrDefaultAsync(pm =>
                    pm.ProjectId == projectId &&
                    pm.UserId == userId);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "Project membership not found."
                });
            }

            var currentUserId = AccessControlService.GetUserId(User);
            if (currentUserId.HasValue)
            {
                _activityLogger.Add(
                    currentUserId.Value,
                    "Project",
                    projectId,
                    "Project member removed",
                    $"Removed {member.User.FullName} from the project.");
            }

            _context.ProjectMembers.Remove(member);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User removed from project successfully."
            });
        }
    }
}
