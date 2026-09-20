using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs
{
    public class RegisterRequest
    {
        [Required, MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Range(1, int.MaxValue)]
        public int DepartmentId { get; set; }
    }
}
