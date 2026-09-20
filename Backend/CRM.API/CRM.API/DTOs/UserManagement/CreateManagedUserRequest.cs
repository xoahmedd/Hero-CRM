namespace CRM.API.DTOs.UserManagement
{
    public class CreateManagedUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
        public int? DepartmentId { get; set; }
        public string? ProfileImage { get; set; }
    }
}
