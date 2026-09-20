namespace CRM.API.DTOs.Team
{
    public class TeamMemberResponse
    {
        public int TeamId { get; set; }

        public int UserId { get; set; }

        public string? UserName { get; set; }

        public string? Email { get; set; }

        public DateTime JoinedAt { get; set; }
    }
}