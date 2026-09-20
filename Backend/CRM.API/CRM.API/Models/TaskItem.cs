using System.Net.Mail;
using CRM.API.DTOs.TaskItem;

namespace CRM.API.Models
{
    public class TaskItem
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = "Todo";

        public string Priority { get; set; } = "Medium";

        public int? ProjectId { get; set; }

        public int CreatedById { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Relationships
        public Project? Project { get; set; }

        public User CreatedBy { get; set; } = null!;

        public ICollection<TaskAssignee> Assignees { get; set; }
            = new List<TaskAssignee>();

        public ICollection<SubTask> SubTasks { get; set; }
            = new List<SubTask>();

        public ICollection<Comment> Comments { get; set; }
            = new List<Comment>();

        public ICollection<Attachment> Attachments { get; set; }
            = new List<Attachment>();

        public ICollection<TaskTag> TaskTags { get; set; }
            = new List<TaskTag>();
    }
}