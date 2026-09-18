using System;

namespace Application.DTOs.Users
{
    public class UserResponse
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfileImage { get; set; }
        public bool IsActive { get; set; }
        public string Role { get; set; } = "Developer";
        public DateTime CreatedAt { get; set; }
    }
}
