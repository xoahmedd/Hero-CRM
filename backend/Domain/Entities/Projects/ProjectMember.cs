namespace Domain.Entities.Projects
{
    public class ProjectMember
    {
        public int ProjectId { get; set; }
        public int UserId { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;


        public Project Project { get; set; } = null!;
    }
}
