using Application.Common;
using Application.DTOs.Projects;
using Application.Repos_Interfaces;
using Domain.Entities.Identity;
using Domain.Entities.Projects;
using Infrastructure._Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/Projects/{projectId:int}/members")]
    public class ProjectMembersController : ControllerBase
    {
        private readonly IGenericRepository<Project> _projectRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;

        public ProjectMembersController(
            IGenericRepository<Project> projectRepo,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context)
        {
            _projectRepo = projectRepo;
            _userManager = userManager;
            _context = context;
        }

        // GET: api/Projects/1/members
        [HttpGet]
        public async Task<IActionResult> GetMembers(
            int projectId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var project = await _projectRepo.GetByIdAsync(projectId);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var index = pageIndex ?? 1;
                var size = pageSize ?? 20;

                var baseQuery = _context.ProjectMembers
                    .AsNoTracking()
                    .Where(pm => pm.ProjectId == projectId)
                    .OrderBy(pm => pm.JoinedAt);

                var totalCount = await baseQuery.CountAsync();

                var pagedMembers = await baseQuery
                    .Skip((index - 1) * size)
                    .Take(size)
                    .ToListAsync();

                var pagedResponses = new List<ProjectMemberResponse>();
                foreach (var pm in pagedMembers)
                {
                    var user = await _userManager.FindByIdAsync(pm.UserId.ToString());
                    pagedResponses.Add(new ProjectMemberResponse
                    {
                        ProjectId = pm.ProjectId,
                        UserId = pm.UserId,
                        FullName = user?.FullName ?? string.Empty,
                        Email = user?.Email ?? string.Empty,
                        ProfileImage = user?.ProfileImage,
                        JoinedAt = pm.JoinedAt
                    });
                }

                return Ok(new Pagination<ProjectMemberResponse>(index, size, totalCount, pagedResponses));
            }

            var members = await _context.ProjectMembers
                .AsNoTracking()
                .Where(pm => pm.ProjectId == projectId)
                .OrderBy(pm => pm.JoinedAt)
                .ToListAsync();

            var responseList = new List<ProjectMemberResponse>();
            foreach (var pm in members)
            {
                var user = await _userManager.FindByIdAsync(pm.UserId.ToString());
                responseList.Add(new ProjectMemberResponse
                {
                    ProjectId = pm.ProjectId,
                    UserId = pm.UserId,
                    FullName = user?.FullName ?? string.Empty,
                    Email = user?.Email ?? string.Empty,
                    ProfileImage = user?.ProfileImage,
                    JoinedAt = pm.JoinedAt
                });
            }

            return Ok(responseList);
        }

        // POST: api/Projects/1/members/2
        [HttpPost("{userId:int}")]
        public async Task<IActionResult> AddMember(int projectId, int userId)
        {
            var project = await _projectRepo.GetByIdAsync(projectId);

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

            var user = await _userManager.FindByIdAsync(userId.ToString());

            if (user == null || !user.IsActive)
            {
                return NotFound(new
                {
                    message = "User not found or inactive."
                });
            }

            var alreadyMember = await _context.ProjectMembers
                .AnyAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

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

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "User added to project successfully."
            });
        }

        // DELETE: api/Projects/1/members/2
        [HttpDelete("{userId:int}")]
        public async Task<IActionResult> RemoveMember(int projectId, int userId)
        {
            var project = await _projectRepo.GetByIdAsync(projectId);

            if (project == null)
            {
                return NotFound(new
                {
                    message = "Project not found."
                });
            }

            var member = await _context.ProjectMembers
                .FirstOrDefaultAsync(pm => pm.ProjectId == projectId && pm.UserId == userId);

            if (member == null)
            {
                return NotFound(new
                {
                    message = "Project membership not found."
                });
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
