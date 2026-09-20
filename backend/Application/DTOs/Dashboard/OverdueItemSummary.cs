using System;

namespace Application.DTOs.Dashboard
{
    public class OverdueItemSummary
    {
        public string ItemType { get; set; } = string.Empty; // "Project" or "Task"
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime? DueDate { get; set; }
        public int? AssignedUserId { get; set; }
        public string? AssignedUserName { get; set; }
        public string? RequestingDepartment { get; set; }
        public string? MissedDeadlineReason { get; set; }
        public string? ReasonCategory { get; set; }
        public bool HasSubmittedReason => !string.IsNullOrWhiteSpace(MissedDeadlineReason);
    }
}

