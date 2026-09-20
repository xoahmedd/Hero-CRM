namespace CRM.API.DTOs.UserManagement
{
    public class UpdateManagedUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = "User";
        public int? DepartmentId { get; set; }
        public bool IsActive { get; set; } = true;
        public string? ProfileImage { get; set; }
    }
}
