using Domain.Entities.Collaborations;
using Domain.Entities.Projects;
using Domain.Enums;

namespace Domain.Entities.Tasks
{
    public class TaskItem : BaseEntity
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TaskItemStatus Status { get; set; } = TaskItemStatus.Assigned;
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        public int ProjectId { get; set; }
        public int CreatedById { get; set; }
        public DateTime? DueDate { get; set; }
        public string? MissedDeadlineReason { get; set; }
        public string? ReasonCategory { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }


        public Project Project { get; set; } = null!;
        public ICollection<TaskAssignee> Assignees { get; set; }
            = new List<TaskAssignee>();
        public ICollection<Comment> Comments { get; set; }
            = new List<Comment>();
    }
}
