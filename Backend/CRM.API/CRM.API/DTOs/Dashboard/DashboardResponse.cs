namespace CRM.API.DTOs.Dashboard
{
    public class DashboardResponse
    {
        public int TotalDepartments { get; set; }
        public int TotalPeople { get; set; }
        public int TotalProjects { get; set; }
        public int ActiveProjects { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int TotalUsers { get; set; }
        public int OpenFollowUps { get; set; }
        public int OverdueFollowUps { get; set; }
        public int DueTodayFollowUps { get; set; }
        public double TaskCompletionRate { get; set; }
        public List<DashboardFollowUpItem> UpcomingFollowUps { get; set; } = new();
        public List<DashboardActivityItem> RecentActivities { get; set; } = new();
    }

    public class DashboardFollowUpItem
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public DateTime DueAt { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public string? TargetLabel { get; set; }
    }

    public class DashboardActivityItem
    {
        public int Id { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string UserName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
