using System;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.DTOs.Tasks.TaskItem
{
    public class UpdateTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        public TaskItemStatus? Status { get; set; }

        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        public DateTime? DueDate { get; set; }

        [MaxLength(2000)]
        public string? MissedDeadlineReason { get; set; }

        public List<int>? AssigneeIds { get; set; }
    }
}
