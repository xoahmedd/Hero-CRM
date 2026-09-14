using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Enums;

namespace Application.DTOs.Tasks.TaskItem
{
    public class CreateTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        public TaskItemStatus Status { get; set; } = TaskItemStatus.Todo;

        public TaskPriority Priority { get; set; } = TaskPriority.Medium;

        [Required]
        public int ProjectId { get; set; }

        [Required]
        public int CreatedById { get; set; }

        public DateTime? DueDate { get; set; }
    }
}
