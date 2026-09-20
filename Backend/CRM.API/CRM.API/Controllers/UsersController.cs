using System.Security.Claims;
using CRM.API.Data;
using CRM.API.DTOs.UserManagement;
using CRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private static readonly string[] AllowedRoles = ["Admin", "User"];
        private readonly ApplicationDbContext _context;

        public UsersController(ApplicationDbContext context) => _context = context;

        // Active non-admin users used by team/task/project assignment screens.
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _context.Users.AsNoTracking()
                .Where(u => u.IsActive && !u.UserRoles.Any(ur => ur.Role.Name == "Admin"))
                .OrderBy(u => u.FullName)
                .Select(u => new
                {
                    userId = u.Id,
                    fullName = u.FullName,
                    email = u.Email,
                    profileImage = u.ProfileImage,
                    departmentId = (int?)null,
                    departmentName = (string?)null
                })
                .ToListAsync();

            return Ok(users);
        }

        [HttpGet("manage")]
        public async Task<ActionResult<IEnumerable<ManagedUserResponse>>> GetManagedUsers() =>
            Ok(await BuildManagedUsersAsync());

        [HttpGet("manage/{id:int}")]
        public async Task<ActionResult<ManagedUserResponse>> GetManagedUser(int id)
        {
            var users = await BuildManagedUsersAsync(id);
            var user = users.FirstOrDefault();
            return user == null ? NotFound(new { message = "User not found." }) : Ok(user);
        }

        [HttpPost]
        public async Task<ActionResult<ManagedUserResponse>> CreateUser(CreateManagedUserRequest request)
        {
            var validation = ValidateCommonFields(request.FullName, request.Email, request.Role, request.ProfileImage);
            if (validation != null) return BadRequest(new { message = validation });
            if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
                return BadRequest(new { message = "Password must be at least 6 characters." });

            var normalizedRole = NormalizeRole(request.Role);
            var email = request.Email.Trim().ToLowerInvariant();

            if (await _context.Users.AnyAsync(u => u.Email == email))
                return Conflict(new { message = "Email is already registered." });

            var role = await ResolveStoredRoleAsync(normalizedRole);
            if (role == null)
                return BadRequest(new { message = "The selected role is not configured." });

            var user = new User
            {
                FullName = request.FullName.Trim(),
                Email = email,
                ProfileImage = NormalizeProfileImage(request.ProfileImage),
                DepartmentId = null,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            user.PasswordHash = new PasswordHasher<User>().HashPassword(user, request.Password);
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _context.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });
            await _context.SaveChangesAsync();

            var response = (await BuildManagedUsersAsync(user.Id)).Single();
            return CreatedAtAction(nameof(GetManagedUser), new { id = user.Id }, response);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ManagedUserResponse>> UpdateUser(int id, UpdateManagedUserRequest request)
        {
            var validation = ValidateCommonFields(request.FullName, request.Email, request.Role, request.ProfileImage);
            if (validation != null) return BadRequest(new { message = validation });

            var target = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (target == null) return NotFound(new { message = "User not found." });

            var currentRole = target.UserRoles.Any(ur => ur.Role.Name == "Admin") ? "Admin" : "User";
            var requestedRole = NormalizeRole(request.Role);
            var currentUserId = GetCurrentUserId();

            if (currentUserId == target.Id && (requestedRole != currentRole || !request.IsActive))
                return BadRequest(new { message = "You cannot change your own role or deactivate your own account here." });

            if (currentRole == "Admin" && (requestedRole != "Admin" || !request.IsActive))
            {
                var activeAdminCount = await _context.UserRoles.CountAsync(
                    ur => ur.Role.Name == "Admin" && ur.User.IsActive);

                if (activeAdminCount <= 1)
                    return BadRequest(new { message = "The workspace must keep at least one active Admin." });
            }

            var email = request.Email.Trim().ToLowerInvariant();
            if (await _context.Users.AnyAsync(u => u.Email == email && u.Id != target.Id))
                return Conflict(new { message = "Email is already registered to another user." });

            var role = await ResolveStoredRoleAsync(requestedRole);
            if (role == null)
                return BadRequest(new { message = "The selected role is not configured." });

            target.FullName = request.FullName.Trim();
            target.Email = email;
            target.ProfileImage = NormalizeProfileImage(request.ProfileImage);
            target.DepartmentId = null;
            target.IsActive = request.IsActive;
            target.UpdatedAt = DateTime.UtcNow;

            var matchingRole = target.UserRoles.FirstOrDefault(ur => ur.RoleId == role.Id);
            _context.UserRoles.RemoveRange(target.UserRoles.Where(ur => ur.RoleId != role.Id).ToList());
            if (matchingRole == null)
                _context.UserRoles.Add(new UserRole { UserId = target.Id, RoleId = role.Id });

            await _context.SaveChangesAsync();
            return Ok((await BuildManagedUsersAsync(target.Id)).Single());
        }

        [HttpPost("{id:int}/reset-password")]
        public async Task<IActionResult> ResetPassword(int id, ResetManagedUserPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 6)
                return BadRequest(new { message = "New password must be at least 6 characters." });

            if (GetCurrentUserId() == id)
                return BadRequest(new { message = "Use Settings to change your own password." });

            var target = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (target == null) return NotFound(new { message = "User not found." });

            target.PasswordHash = new PasswordHasher<User>().HashPassword(target, request.NewPassword);
            target.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Password reset successfully." });
        }

        private async Task<List<ManagedUserResponse>> BuildManagedUsersAsync(int? onlyId = null)
        {
            var query = _context.Users.AsNoTracking().AsQueryable();

            if (onlyId.HasValue)
                query = query.Where(u => u.Id == onlyId.Value);

            var rows = await query
                .OrderByDescending(u => u.IsActive)
                .ThenBy(u => u.FullName)
                .Select(u => new
                {
                    u.Id,
                    u.FullName,
                    u.Email,
                    u.ProfileImage,
                    u.IsActive,
                    u.CreatedAt,
                    u.UpdatedAt,
                    IsAdmin = u.UserRoles.Any(ur => ur.Role.Name == "Admin"),
                    AssignedTaskCount = u.TaskAssignments.Count,
                    ProjectCount = u.ProjectMemberships.Count + u.OwnedProjects.Count,
                    TeamCount = u.TeamMemberships.Count
                })
                .ToListAsync();

            return rows.Select(u => new ManagedUserResponse
            {
                UserId = u.Id,
                FullName = u.FullName,
                Email = u.Email,
                ProfileImage = u.ProfileImage,
                IsActive = u.IsActive,
                DepartmentId = null,
                DepartmentName = null,
                Roles = [u.IsAdmin ? "Admin" : "User"],
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                AssignedTaskCount = u.AssignedTaskCount,
                ProjectCount = u.ProjectCount,
                TeamCount = u.TeamCount
            }).ToList();
        }

        private async Task<Role?> ResolveStoredRoleAsync(string normalizedRole)
        {
            if (normalizedRole == "Admin")
                return await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin");

            // Prefer the existing User role. Fall back to the old Developer role so
            // existing databases do not need a role-data migration for this UI rename.
            var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "User");
            if (userRole != null) return userRole;

            return await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Developer");
        }

        private string? ValidateCommonFields(string fullName, string emailValue, string role, string? profileImage)
        {
            if (string.IsNullOrWhiteSpace(fullName)) return "Full name is required.";
            if (string.IsNullOrWhiteSpace(emailValue) || !emailValue.Contains('@')) return "Enter a valid email address.";
            if (!AllowedRoles.Contains(NormalizeRole(role))) return "Role must be Admin or User.";

            if (!string.IsNullOrWhiteSpace(profileImage) &&
                (!Uri.TryCreate(profileImage.Trim(), UriKind.Absolute, out var uri) ||
                 (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)))
            {
                return "Profile image must be a valid http or https URL.";
            }

            return null;
        }

        private static string NormalizeRole(string value) =>
            value?.Trim().Equals("Admin", StringComparison.OrdinalIgnoreCase) == true ? "Admin" : "User";

        private static string? NormalizeProfileImage(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private int? GetCurrentUserId()
        {
            var value = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(value, out var id) ? id : null;
        }
    }
}
