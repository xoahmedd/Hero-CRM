using Domain.Entities.Tasks;
using Domain.Enums;

namespace Domain.Entities.Projects
{
    public class Project : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public ProjectStatus Status { get; set; } = ProjectStatus.InProgress;
        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
        public int OwnerId { get; set; }
        public string? RequestingDepartment { get; set; }
        public string? RequestedBy { get; set; }
        public string? BusinessJustification { get; set; }
        public string? RejectionReason { get; set; }
        public string? MissedDeadlineReason { get; set; }
        public string? ReasonCategory { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public ICollection<ProjectMember> Members { get; set; }
            = new List<ProjectMember>();
        public ICollection<TaskItem> Tasks { get; set; }
            = new List<TaskItem>();
    }
}
