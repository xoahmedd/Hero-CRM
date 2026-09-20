namespace CRM.API.DTOs.Team
{
    public class TeamWorkloadResponse
    {
        public int TeamId { get; set; }
        public string TeamName { get; set; } = string.Empty;
        public DateTime GeneratedAt { get; set; }
        public int TotalMembers { get; set; }
        public int TotalOpenTasks { get; set; }
        public int TotalOverdueTasks { get; set; }
        public List<TeamMemberWorkloadResponse> Members { get; set; } = [];
    }

    public class TeamMemberWorkloadResponse
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int AssignedTasks { get; set; }
        public int OpenTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int PendingTasks { get; set; }
        public int FinishedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int DueSoonTasks { get; set; }
        public int HighPriorityOpenTasks { get; set; }
        public string UtilizationLevel { get; set; } = "Available";
    }
}
