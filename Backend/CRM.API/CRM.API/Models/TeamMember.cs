namespace CRM.API.Models
{
    public class TeamMember
    {
        public int TeamId { get; set; }

        public int UserId { get; set; }

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        public Team Team { get; set; } = null!;

        public User User { get; set; } = null!;
    }
}