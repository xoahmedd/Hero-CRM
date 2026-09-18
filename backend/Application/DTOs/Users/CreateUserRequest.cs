using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Users
{
    public class CreateUserRequest
    {
        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } = string.Empty;

        public string? Password { get; set; }

        [MaxLength(1000)]
        public string? ProfileImage { get; set; }

        public bool IsActive { get; set; } = true;
        public string? Role { get; set; }
    }
}
