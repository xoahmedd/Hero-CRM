using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Enums;

namespace Application.DTOs.Tasks.TaskItem
{
    public class TaskResponse
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public TaskItemStatus Status { get; set; }

        public TaskPriority Priority { get; set; }

        public int ProjectId { get; set; }

        public string? ProjectName { get; set; }

        public int CreatedById { get; set; }

        public string? CreatedByName { get; set; }

        public DateTime? DueDate { get; set; }

        public string? MissedDeadlineReason { get; set; }

        public string? ReasonCategory { get; set; }

        public bool IsOverdue { get; set; }

        public List<TaskAssigneeResponse> Assignees { get; set; } = new();

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}
