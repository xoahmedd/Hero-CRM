using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.DTOs.Projects
{
    public class UpdateProjectRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        public ProjectStatus Status { get; set; } = ProjectStatus.InProgress;

        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        [MaxLength(100)]
        public string? RequestingDepartment { get; set; }

        [MaxLength(2000)]
        public string? MissedDeadlineReason { get; set; }

        [MaxLength(100)]
        public string? ReasonCategory { get; set; }

        public int? OwnerId { get; set; }
        public List<int>? MemberIds { get; set; }
    }
}
