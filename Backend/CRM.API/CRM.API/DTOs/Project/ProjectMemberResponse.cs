namespace CRM.API.DTOs.Project
{
    public class ProjectMemberResponse
    {
        public int ProjectId { get; set; }

        public int UserId { get; set; }

        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? ProfileImage { get; set; }

        public DateTime JoinedAt { get; set; }
    }
}
