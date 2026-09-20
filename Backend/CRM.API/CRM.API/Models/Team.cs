namespace CRM.API.Models
{
    public class Team
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int CreatedById { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Relationships
        public User CreatedBy { get; set; } = null!;

        public ICollection<TeamMember> Members { get; set; }
            = new List<TeamMember>();

        public ICollection<Project> Projects { get; set; }
            = new List<Project>();
    }
}