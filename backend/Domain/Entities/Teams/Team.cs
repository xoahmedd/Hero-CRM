namespace Domain.Entities.Teams
{
    public class Team : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int CreatedById { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;


        public ICollection<TeamMember> Members { get; set; }
            = new List<TeamMember>();
    }
}
