using Application.DTOs.Auth;
using Application.Services_Interfaces;
using Domain.Entities.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;

namespace Hero_CRM.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly RoleManager<ApplicationRole> _roleManager;
        private readonly IJwtService _jwtService;

        public AuthController(
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager,
            IJwtService jwtService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _jwtService = jwtService;
        }

        // POST: api/Auth/login
        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Email and password are required." });
            }

            var email = request.Email.Trim().ToLowerInvariant();
            var user = await _userManager.FindByEmailAsync(email);

            if (user == null || !user.IsActive)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
            if (!isPasswordValid)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var roles = await _userManager.GetRolesAsync(user);
            var token = _jwtService.GenerateToken(user, roles);

            var response = new AuthResponse
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                ProfileImage = user.ProfileImage,
                Roles = roles.ToList(),
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            return Ok(response);
        }

        // POST: api/Auth/register
        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Full name, email, and password are required." });
            }

            var email = request.Email.Trim().ToLowerInvariant();
            var existingUser = await _userManager.FindByEmailAsync(email);
            if (existingUser != null)
            {
                return Conflict(new { message = "An account with this email already exists." });
            }

            var initials = string.Empty;
            var nameParts = request.FullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            foreach (var part in nameParts)
            {
                if (initials.Length < 2 && part.Length > 0)
                {
                    initials += char.ToUpperInvariant(part[0]);
                }
            }
            if (string.IsNullOrEmpty(initials)) initials = "U";

            var user = new ApplicationUser
            {
                FullName = request.FullName.Trim(),
                Email = email,
                UserName = email,
                ProfileImage = initials,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                return BadRequest(new
                {
                    message = "Registration failed.",
                    errors = result.Errors.Select(e => e.Description)
                });
            }

            // Public registration defaults to Developer role
            await _userManager.AddToRoleAsync(user, "Developer");
            var roles = new List<string> { "Developer" };

            var token = _jwtService.GenerateToken(user, roles);

            var response = new AuthResponse
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ProfileImage = user.ProfileImage,
                Roles = roles,
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            return Ok(response);
        }

        // GET: api/Auth/me
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser([FromQuery] int? userId)
        {
            var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier)
                                ?? User.FindFirst("nameid")?.Value
                                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
                                ?? User.FindFirst("sub")?.Value;
            int targetId = userId ?? (int.TryParse(currentUserIdStr, out var cid) ? cid : 0);

            if (targetId == 0)
            {
                return BadRequest(new { message = "User ID is required." });
            }

            var user = await _userManager.FindByIdAsync(targetId.ToString());
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            var roles = await _userManager.GetRolesAsync(user);

            return Ok(new
            {
                id = user.Id,
                fullName = user.FullName,
                email = user.Email,
                avatar = user.ProfileImage ?? (user.FullName.Length >= 2 ? user.FullName.Substring(0, 2).ToUpper() : "U"),
                role = roles.FirstOrDefault() ?? "Developer",
                isActive = user.IsActive,
                createdAt = user.CreatedAt
            });
        }
    }
}
