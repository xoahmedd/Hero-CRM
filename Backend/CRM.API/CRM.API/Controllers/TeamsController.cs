using CRM.API.Data;
using CRM.API.DTOs.Team;
using CRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class TeamsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TeamsController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TeamResponse>>> GetTeams()
        {
            var teams = await _context.Teams
                .AsNoTracking()
                .Include(t => t.CreatedBy)
                .OrderByDescending(t => t.CreatedAt)
                .Select(t => new TeamResponse
                {
                    Id = t.Id,
                    Name = t.Name,
                    Description = t.Description,
                    CreatedById = t.CreatedById,
                    CreatedByName = t.CreatedBy.FullName,
                    CreatedAt = t.CreatedAt
                })
                .ToListAsync();

            return Ok(teams);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<TeamResponse>>
            CreateTeam(CreateTeamRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == request.CreatedById);

            if (user == null)
            {
                return BadRequest(new
                {
                    message = "Creator user not found."
                });
            }

            var team = new Team
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                CreatedById = request.CreatedById,
                CreatedAt = DateTime.UtcNow
            };

            _context.Teams.Add(team);
            await _context.SaveChangesAsync();

            return Ok(new TeamResponse
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                CreatedById = team.CreatedById,
                CreatedByName = user.FullName,
                CreatedAt = team.CreatedAt
            });
        }

        [HttpGet("{teamId:int}/members")]
        public async Task<ActionResult<IEnumerable<TeamMemberResponse>>>
            GetMembers(int teamId)
        {
            var teamExists = await _context.Teams
                .AnyAsync(t => t.Id == teamId);

            if (!teamExists)
            {
                return NotFound(new
                {
                    message = "Team not found."
                });
            }

            var members = await _context.TeamMembers
                .AsNoTracking()
                .Include(tm => tm.User)
                .Where(tm => tm.TeamId == teamId)
                .OrderBy(tm => tm.JoinedAt)
                .Select(tm => new TeamMemberResponse
                {
                    TeamId = tm.TeamId,
                    UserId = tm.UserId,
                    UserName = tm.User.FullName,
                    Email = tm.User.Email,
                    JoinedAt = tm.JoinedAt
                })
                .ToListAsync();

            return Ok(members);
        }

        [HttpPost("{teamId:int}/members/{userId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddMember(
            int teamId,
            int userId)
        {
            var teamExists = await _context.Teams
                .AnyAsync(t => t.Id == teamId);

            if (!teamExists)
            {
                return NotFound(new
                {
                    message = "Team not found."
                });
            }

            var userExists = await _context.Users
                .AnyAsync(u =>
                    u.Id == userId &&
                    u.IsActive &&
                    u.UserRoles.Any(ur => ur.Role.Name == "User" || ur.Role.Name == "Developer"));

            if (!userExists)
            {
                return NotFound(new
                {
                    message = "Active User account not found."
                });
            }

            var alreadyMember = await _context.TeamMembers
                .AnyAsync(tm =>
                    tm.TeamId == teamId &&
                    tm.UserId == userId);

            if (alreadyMember)
            {
                return Conflict(new
                {
                    message = "User is already a member of this team."
                });
            }

            _context.TeamMembers.Add(new TeamMember
            {
                TeamId = teamId,
                UserId = userId,
                JoinedAt = DateTime.UtcNow
            });

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User added to team successfully."
            });
        }

        [HttpDelete("{teamId:int}/members/{userId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveMember(
            int teamId,
            int userId)
        {
            var member = await _context.TeamMembers
                .FirstOrDefaultAsync(tm =>
                    tm.TeamId == teamId &&
                    tm.UserId == userId);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "Team membership not found."
                });
            }

            _context.TeamMembers.Remove(member);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User removed from team successfully."
            });
        }


        [HttpGet("{teamId:int}/workload")]
        public async Task<ActionResult<TeamWorkloadResponse>> GetWorkload(int teamId)
        {
            var team = await _context.Teams
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == teamId);

            if (team == null)
            {
                return NotFound(new
                {
                    message = "Team not found."
                });
            }

            var members = await _context.TeamMembers
                .AsNoTracking()
                .Where(tm => tm.TeamId == teamId)
                .Select(tm => new
                {
                    tm.UserId,
                    tm.User.FullName,
                    tm.User.Email
                })
                .OrderBy(tm => tm.FullName)
                .ToListAsync();

            var memberIds = members.Select(m => m.UserId).ToArray();

            List<WorkloadAssignment> assignments;
            if (memberIds.Length == 0)
            {
                assignments = [];
            }
            else
            {
                assignments = await _context.TaskAssignees
                    .AsNoTracking()
                    .Where(ta => memberIds.Contains(ta.UserId))
                    .Select(ta => new WorkloadAssignment
                    {
                        UserId = ta.UserId,
                        TaskId = ta.TaskItemId,
                        Status = ta.TaskItem.Status,
                        Priority = ta.TaskItem.Priority,
                        DueDate = ta.TaskItem.DueDate
                    })
                    .ToListAsync();
            }

            var now = DateTime.UtcNow;
            var dueSoonCutoff = now.AddDays(7);

            var memberRows = members.Select(member =>
            {
                var userTasks = assignments
                    .Where(a => a.UserId == member.UserId)
                    .ToList();

                var openTasks = userTasks
                    .Where(a => a.Status != "Finished")
                    .ToList();

                var overdue = openTasks.Count(a =>
                    a.DueDate.HasValue &&
                    a.DueDate.Value < now);

                var dueSoon = openTasks.Count(a =>
                    a.DueDate.HasValue &&
                    a.DueDate.Value >= now &&
                    a.DueDate.Value <= dueSoonCutoff);

                return new TeamMemberWorkloadResponse
                {
                    UserId = member.UserId,
                    UserName = member.FullName,
                    Email = member.Email,
                    AssignedTasks = userTasks.Count,
                    OpenTasks = openTasks.Count,
                    InProgressTasks = userTasks.Count(a => a.Status == "InProgress"),
                    PendingTasks = userTasks.Count(a => a.Status == "Pending"),
                    FinishedTasks = userTasks.Count(a => a.Status == "Finished"),
                    OverdueTasks = overdue,
                    DueSoonTasks = dueSoon,
                    HighPriorityOpenTasks = openTasks.Count(a =>
                        a.Priority.Equals("High", StringComparison.OrdinalIgnoreCase) ||
                        a.Priority.Equals("Critical", StringComparison.OrdinalIgnoreCase)),
                    UtilizationLevel = GetUtilizationLevel(openTasks.Count, overdue)
                };
            }).ToList();

            var uniqueOpenTaskIds = assignments
                .Where(a => a.Status != "Finished")
                .Select(a => a.TaskId)
                .Distinct()
                .ToHashSet();

            var uniqueOverdueTaskIds = assignments
                .Where(a =>
                    a.Status != "Finished" &&
                    a.DueDate.HasValue &&
                    a.DueDate.Value < now)
                .Select(a => a.TaskId)
                .Distinct()
                .ToHashSet();

            return Ok(new TeamWorkloadResponse
            {
                TeamId = team.Id,
                TeamName = team.Name,
                GeneratedAt = now,
                TotalMembers = members.Count,
                TotalOpenTasks = uniqueOpenTaskIds.Count,
                TotalOverdueTasks = uniqueOverdueTaskIds.Count,
                Members = memberRows
            });
        }

        private static string GetUtilizationLevel(int openTasks, int overdueTasks)
        {
            if (overdueTasks >= 3 || openTasks >= 9)
            {
                return "Overloaded";
            }

            if (overdueTasks >= 1 || openTasks >= 6)
            {
                return "Busy";
            }

            if (openTasks >= 3)
            {
                return "Balanced";
            }

            return "Available";
        }

        private sealed class WorkloadAssignment
        {
            public int UserId { get; set; }
            public int TaskId { get; set; }
            public string Status { get; set; } = string.Empty;
            public string Priority { get; set; } = string.Empty;
            public DateTime? DueDate { get; set; }
        }
    }
}