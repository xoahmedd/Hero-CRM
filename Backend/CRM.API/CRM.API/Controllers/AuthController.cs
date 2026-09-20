using CRM.API.Data;
using CRM.API.DTOs;
using CRM.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // =========================
        // LOGIN
        // =========================

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Email and password are required."
                });
            }

            var email = request.Email.Trim().ToLowerInvariant();

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            if (!user.IsActive)
            {
                return Unauthorized(new
                {
                    message = "This account is inactive."
                });
            }

            var passwordHasher = new PasswordHasher<User>();

            var result = passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.Password);

            if (result == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid email or password."
                });
            }

            var roles = user.UserRoles
                .Select(ur => ur.Role.Name)
                .ToList();

            return Ok(BuildAuthResponse(user, roles));
        }

        // =========================
        // CURRENT USER
        // =========================

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid authentication token."
                });
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Include(u => u.Department)
                .AsNoTracking()
                .FirstOrDefaultAsync(u =>
                    u.Id == userId.Value &&
                    u.IsActive);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            return Ok(new
            {
                userId = user.Id,
                fullName = user.FullName,
                email = user.Email,
                profileImage = user.ProfileImage,
                departmentId = user.DepartmentId,
                departmentName = user.Department != null ? user.Department.Name : null,
                roles = NormalizeRoles(user.UserRoles.Select(ur => ur.Role.Name))
            });
        }

        // =========================
        // UPDATE PROFILE
        // =========================

        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile(
            UpdateProfileRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid authentication token."
                });
            }

            if (string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new
                {
                    message = "Full name and email are required."
                });
            }

            var fullName = request.FullName.Trim();
            var email = request.Email.Trim().ToLowerInvariant();

            if (!email.Contains('@') ||
                email.StartsWith('@') ||
                email.EndsWith('@'))
            {
                return BadRequest(new
                {
                    message = "Enter a valid email address."
                });
            }

            string? profileImage = null;

            if (!string.IsNullOrWhiteSpace(request.ProfileImage))
            {
                var profileImageValue = request.ProfileImage.Trim();

                if (!Uri.TryCreate(
                        profileImageValue,
                        UriKind.Absolute,
                        out var imageUri) ||
                    (imageUri.Scheme != Uri.UriSchemeHttp &&
                     imageUri.Scheme != Uri.UriSchemeHttps))
                {
                    return BadRequest(new
                    {
                        message = "Profile image must be a valid http or https URL."
                    });
                }

                profileImage = profileImageValue;
            }

            var user = await _context.Users
                .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .Include(u => u.Department)
                .FirstOrDefaultAsync(u =>
                    u.Id == userId.Value &&
                    u.IsActive);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var emailUsedByAnotherUser = await _context.Users
                .AnyAsync(u =>
                    u.Email == email &&
                    u.Id != user.Id);

            if (emailUsedByAnotherUser)
            {
                return Conflict(new
                {
                    message = "Email is already registered to another account."
                });
            }

            user.FullName = fullName;
            user.Email = email;
            user.ProfileImage = profileImage;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var roles = user.UserRoles
                .Select(ur => ur.Role.Name)
                .ToList();

            // Return a fresh JWT so the name/email claims stay in sync
            // with the profile the user just saved.
            return Ok(BuildAuthResponse(user, roles));
        }

        // =========================
        // CHANGE PASSWORD
        // =========================

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(
            ChangePasswordRequest request)
        {
            var userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid authentication token."
                });
            }

            if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new
                {
                    message = "Current password and new password are required."
                });
            }

            if (request.NewPassword.Length < 6)
            {
                return BadRequest(new
                {
                    message = "New password must be at least 6 characters."
                });
            }

            if (request.CurrentPassword == request.NewPassword)
            {
                return BadRequest(new
                {
                    message = "New password must be different from the current password."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(u =>
                    u.Id == userId.Value &&
                    u.IsActive);

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var passwordHasher = new PasswordHasher<User>();

            var result = passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                request.CurrentPassword);

            if (result == PasswordVerificationResult.Failed)
            {
                return BadRequest(new
                {
                    message = "Current password is incorrect."
                });
            }

            user.PasswordHash = passwordHasher.HashPassword(
                user,
                request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Password changed successfully."
            });
        }

        // =========================
        // HELPERS
        // =========================

        private int? GetCurrentUserId()
        {
            var userIdValue = User.FindFirst(
                ClaimTypes.NameIdentifier)?.Value;

            return int.TryParse(userIdValue, out var userId)
                ? userId
                : null;
        }

        private AuthResponse BuildAuthResponse(
            User user,
            List<string> roles)
        {
            var normalizedRoles = NormalizeRoles(roles);
            var token = GenerateJwtToken(user, normalizedRoles);

            return new AuthResponse
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                ProfileImage = user.ProfileImage,
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name,
                Roles = normalizedRoles,
                Token = token.Token,
                ExpiresAt = token.ExpiresAt
            };
        }

        private static List<string> NormalizeRoles(IEnumerable<string> roles)
        {
            var roleList = roles.ToList();
            if (roleList.Any(role => role.Equals("Admin", StringComparison.OrdinalIgnoreCase)))
                return new List<string> { "Admin" };

            if (roleList.Any(role =>
                role.Equals("User", StringComparison.OrdinalIgnoreCase) ||
                role.Equals("Developer", StringComparison.OrdinalIgnoreCase)))
            {
                return new List<string> { "User" };
            }

            return new List<string>();
        }

        // =========================
        // GENERATE JWT
        // =========================

        private (string Token, DateTime ExpiresAt)
            GenerateJwtToken(
                User user,
                List<string> roles)
        {
            var jwtKey = _configuration["JwtSettings:Key"];

            if (string.IsNullOrWhiteSpace(jwtKey))
            {
                throw new InvalidOperationException(
                    "JWT Key is not configured.");
            }

            var issuer = _configuration["JwtSettings:Issuer"];
            var audience = _configuration["JwtSettings:Audience"];

            var duration = int.Parse(
                _configuration["JwtSettings:DurationInMinutes"]
                ?? "60");

            var expiresAt = DateTime.UtcNow.AddMinutes(duration);

            var claims = new List<Claim>
            {
                new Claim(
                    JwtRegisteredClaimNames.Sub,
                    user.Id.ToString()),

                new Claim(
                    JwtRegisteredClaimNames.Email,
                    user.Email),

                new Claim(
                    ClaimTypes.NameIdentifier,
                    user.Id.ToString()),

                new Claim(
                    ClaimTypes.Name,
                    user.FullName)
            };

            foreach (var role in roles)
            {
                claims.Add(
                    new Claim(ClaimTypes.Role, role));
            }

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: expiresAt,
                signingCredentials: credentials);

            return (
                new JwtSecurityTokenHandler().WriteToken(token),
                expiresAt
            );
        }
    }
}
