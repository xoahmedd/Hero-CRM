using Application.Common;
using Application.DTOs.Users;
using Domain.Entities.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hero_CRM.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;

        public UsersController(UserManager<ApplicationUser> userManager)
        {
            _userManager = userManager;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<IActionResult> GetUsers(
            [FromQuery] string? search = null,
            [FromQuery] int? pageIndex = null,
            [FromQuery] int? pageSize = null)
        {
            var query = _userManager.Users.AsNoTracking();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var s = search.Trim();
                query = query.Where(u =>
                    u.FullName.Contains(s) ||
                    (u.Email != null && u.Email.Contains(s)));
            }

            query = query.OrderBy(u => u.FullName);

            if (pageIndex.HasValue || pageSize.HasValue)
            {
                var index = pageIndex ?? 1;
                var size = pageSize ?? 20;

                var totalCount = await query.CountAsync();
                var pagedUsers = await query
                    .Skip((index - 1) * size)
                    .Take(size)
                    .ToListAsync();

                var pagedResponses = new List<UserResponse>();
                foreach (var u in pagedUsers)
                {
                    var roles = await _userManager.GetRolesAsync(u);
                    pagedResponses.Add(new UserResponse
                    {
                        Id = u.Id,
                        FullName = u.FullName,
                        Email = u.Email ?? string.Empty,
                        ProfileImage = u.ProfileImage,
                        IsActive = u.IsActive,
                        Role = roles.FirstOrDefault() ?? "Developer",
                        CreatedAt = u.CreatedAt
                    });
                }

                return Ok(new Pagination<UserResponse>(index, size, totalCount, pagedResponses));
            }

            var users = await query.ToListAsync();
            var responses = new List<UserResponse>();
            foreach (var u in users)
            {
                var roles = await _userManager.GetRolesAsync(u);
                responses.Add(new UserResponse
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email ?? string.Empty,
                    ProfileImage = u.ProfileImage,
                    IsActive = u.IsActive,
                    Role = roles.FirstOrDefault() ?? "Developer",
                    CreatedAt = u.CreatedAt
                });
            }

            return Ok(responses);
        }

        // GET: api/Users/5
        [HttpGet("{id:int}")]
        public async Task<ActionResult<UserResponse>> GetUser(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new UserResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                ProfileImage = user.ProfileImage,
                IsActive = user.IsActive,
                Role = roles.FirstOrDefault() ?? "Developer",
                CreatedAt = user.CreatedAt
            });
        }

        // POST: api/Users
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<ActionResult<UserResponse>> CreateUser(CreateUserRequest request)
        {
            var email = request.Email.Trim().ToLowerInvariant();

            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                return Conflict(new
                {
                    message = "Email is already registered."
                });
            }

            var user = new ApplicationUser
            {
                FullName = request.FullName.Trim(),
                Email = email,
                UserName = email,
                ProfileImage = request.ProfileImage?.Trim(),
                IsActive = request.IsActive,
                CreatedAt = DateTime.UtcNow
            };

            var password = string.IsNullOrWhiteSpace(request.Password) ? "Pass123!" : request.Password;

            var result = await _userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to create user.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            var targetRole = string.IsNullOrWhiteSpace(request.Role) ? "Developer" : request.Role.Trim();
            await _userManager.AddToRoleAsync(user, targetRole);

            var response = new UserResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ProfileImage = user.ProfileImage,
                IsActive = user.IsActive,
                Role = targetRole,
                CreatedAt = user.CreatedAt
            };

            return CreatedAtAction(
                nameof(GetUser),
                new { id = user.Id },
                response);
        }

        // PUT: api/Users/5
        [Authorize(Roles = "Admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateUser(int id, UpdateUserRequest request)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var email = request.Email.Trim().ToLowerInvariant();
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null && existingUser.Id != id)
            {
                return Conflict(new
                {
                    message = "Email is already registered to another account."
                });
            }

            user.FullName = request.FullName.Trim();
            user.Email = email;
            user.UserName = email;
            user.ProfileImage = request.ProfileImage?.Trim();
            user.IsActive = request.IsActive;
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to update user.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            return Ok(new
            {
                message = "User updated successfully."
            });
        }

        // DELETE: api/Users/5
        [Authorize(Roles = "Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString());

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var result = await _userManager.DeleteAsync(user);

            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Failed to delete user.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            return Ok(new
            {
                message = "User deleted successfully."
            });
        }
    }
}
