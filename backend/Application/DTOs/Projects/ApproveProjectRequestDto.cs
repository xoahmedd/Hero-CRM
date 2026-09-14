using System;
using System.ComponentModel.DataAnnotations;
using Domain.Enums;

namespace Application.DTOs.Projects
{
    public class ApproveProjectRequestDto
    {
        [Required]
        public int OwnerId { get; set; } // Lead Developer assigned

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public ProjectPriority? Priority { get; set; }
    }
}
