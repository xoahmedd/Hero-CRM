using Application.Common;
using Application.DTOs.Teams;
using Application.Repos_Interfaces;
using AutoMapper;
using Domain.Entities.Identity;
using Domain.Entities.Teams;
using Infrastructure._Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TeamsController : ControllerBase
    {
        private readonly IGenericRepository<Team> _teamRepo;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public TeamsController(
            IGenericRepository<Team> teamRepo,
            UserManager<ApplicationUser> userManager,
            ApplicationDbContext context,
            IMapper mapper)
        {
            _teamRepo = teamRepo;
            _userManager = userManager;
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetTeams(
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var pagedTeams = await _teamRepo.GetPagedAsync(
                    pageIndex ?? 1,
                    pageSize ?? 20,
                    orderBy: q => q.OrderByDescending(t => t.CreatedAt));

                var responses = new List<TeamResponse>();
                foreach (var t in pagedTeams.Data)
                {
                    var resp = _mapper.Map<TeamResponse>(t);
                    var user = await _userManager.FindByIdAsync(t.CreatedById.ToString());
                    resp.CreatedByName = user?.FullName;
                    responses.Add(resp);
                }

                return Ok(new Pagination<TeamResponse>(
                    pagedTeams.PageIndex,
                    pagedTeams.PageSize,
                    pagedTeams.Count,
                    responses));
            }

            var teams = await _teamRepo.GetQueryable()
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            var list = new List<TeamResponse>();
            foreach (var t in teams)
            {
                var resp = _mapper.Map<TeamResponse>(t);
                var user = await _userManager.FindByIdAsync(t.CreatedById.ToString());
                resp.CreatedByName = user?.FullName;
                list.Add(resp);
            }

            return Ok(list);
        }

        [HttpPost]
        public async Task<ActionResult<TeamResponse>> CreateTeam(CreateTeamRequest request)
        {
            var user = await _userManager.FindByIdAsync(request.CreatedById.ToString());

            if (user == null)
            {
                return BadRequest(new
                {
                    message = "Creator user not found."
                });
            }

            var team = _mapper.Map<Team>(request);

            await _teamRepo.AddAsync(team);
            await _teamRepo.SaveChangesAsync();

            var response = _mapper.Map<TeamResponse>(team);
            response.CreatedByName = user.FullName;

            return Ok(response);
        }

        [HttpGet("{teamId:int}/members")]
        public async Task<IActionResult> GetMembers(
            int teamId,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var team = await _teamRepo.GetByIdAsync(teamId);

            if (team == null)
            {
                return NotFound(new
                {
                    message = "Team not found."
                });
            }

            var baseQuery = _context.TeamMembers
                .AsNoTracking()
                .Where(tm => tm.TeamId == teamId)
                .OrderBy(tm => tm.JoinedAt);

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var index = pageIndex ?? 1;
                var size = pageSize ?? 20;

                var totalCount = await baseQuery.CountAsync();

                var pagedMembers = await baseQuery
                    .Skip((index - 1) * size)
                    .Take(size)
                    .ToListAsync();

                var pagedResponses = new List<TeamMemberResponse>();
                foreach (var tm in pagedMembers)
                {
                    var user = await _userManager.FindByIdAsync(tm.UserId.ToString());
                    pagedResponses.Add(new TeamMemberResponse
                    {
                        TeamId = tm.TeamId,
                        UserId = tm.UserId,
                        FullName = user?.FullName ?? string.Empty,
                        Email = user?.Email ?? string.Empty,
                        JoinedAt = tm.JoinedAt
                    });
                }

                return Ok(new Pagination<TeamMemberResponse>(index, size, totalCount, pagedResponses));
            }

            var members = await baseQuery.ToListAsync();

            var responses = new List<TeamMemberResponse>();
            foreach (var tm in members)
            {
                var user = await _userManager.FindByIdAsync(tm.UserId.ToString());
                responses.Add(new TeamMemberResponse
                {
                    TeamId = tm.TeamId,
                    UserId = tm.UserId,
                    FullName = user?.FullName ?? string.Empty,
                    Email = user?.Email ?? string.Empty,
                    JoinedAt = tm.JoinedAt
                });
            }

            return Ok(responses);
        }

        [HttpPost("{teamId:int}/members/{userId:int}")]
        public async Task<IActionResult> AddMember(int teamId, int userId)
        {
            var team = await _teamRepo.GetByIdAsync(teamId);

            if (team == null)
            {
                return NotFound(new
                {
                    message = "Team not found."
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

            var alreadyMember = await _context.TeamMembers
                .AnyAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

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
        public async Task<IActionResult> RemoveMember(int teamId, int userId)
        {
            var member = await _context.TeamMembers
                .FirstOrDefaultAsync(tm => tm.TeamId == teamId && tm.UserId == userId);

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
    }
}
