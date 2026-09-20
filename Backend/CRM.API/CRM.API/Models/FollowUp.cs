namespace CRM.API.Models
{
    public class FollowUp
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Type { get; set; } = "FollowUp";

        public string Status { get; set; } = "Open";

        public string? Description { get; set; }

        public int OwnerId { get; set; }

        public DateTime DueAt { get; set; }

        public string? Outcome { get; set; }

        public DateTime? CompletedAt { get; set; }

        public int? ContactId { get; set; }

        public int? DepartmentId { get; set; }

        public int? ProjectId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public User Owner { get; set; } = null!;

        public Contact? Contact { get; set; }

        public Customer? Department { get; set; }

        public Project? Project { get; set; }
    }
}
