using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Domain.Enums;

namespace Application.DTOs.Projects
{
    public class ProjectResponse
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public ProjectStatus Status { get; set; }

        public ProjectPriority Priority { get; set; }

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public int OwnerId { get; set; }

        public string? OwnerName { get; set; }

        public int? CustomerId { get; set; }

        public string? CustomerName { get; set; }

        public string? RequestingDepartment { get; set; }

        public string? RequestedBy { get; set; }

        public string? BusinessJustification { get; set; }

        public string? RejectionReason { get; set; }

        public string? MissedDeadlineReason { get; set; }

        public string? ReasonCategory { get; set; }

        public bool IsOverdue { get; set; }
        public List<ProjectMemberResponse> Members { get; set; } = new();
    }
}
