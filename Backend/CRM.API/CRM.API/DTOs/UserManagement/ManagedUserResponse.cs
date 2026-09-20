namespace CRM.API.DTOs.UserManagement
{
    public class ManagedUserResponse
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? ProfileImage { get; set; }
        public bool IsActive { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public List<string> Roles { get; set; } = [];
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int AssignedTaskCount { get; set; }
        public int ProjectCount { get; set; }
        public int TeamCount { get; set; }
    }
}
