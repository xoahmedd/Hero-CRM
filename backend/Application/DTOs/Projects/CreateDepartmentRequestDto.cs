using System;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.DTOs.Projects
{
    public class CreateDepartmentRequestDto
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(100)]
        public string RequestingDepartment { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string RequestedBy { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? BusinessJustification { get; set; }

        public DateTime? TargetDeadline { get; set; }

        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;
    }
}
