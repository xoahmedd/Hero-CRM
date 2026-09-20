namespace CRM.API.Models
{
    public class Project
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = "Planning";

        public string Priority { get; set; } = "Medium";

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public int OwnerId { get; set; }

        public int? RequestedById { get; set; }

        public int? CustomerId { get; set; }

        public int? TeamId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // ==========================================
        // Relationships
        // ==========================================

        public User Owner { get; set; } = null!;

        public User? RequestedBy { get; set; }

        public Customer? Customer { get; set; }

        public Team? Team { get; set; }

        public ICollection<ProjectMember> Members { get; set; }
            = new List<ProjectMember>();

        public ICollection<TaskItem> Tasks { get; set; }
            = new List<TaskItem>();
    }
}