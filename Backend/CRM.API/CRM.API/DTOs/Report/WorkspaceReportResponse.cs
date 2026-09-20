namespace CRM.API.DTOs.Report
{
    public class WorkspaceReportResponse
    {
        public DateTime GeneratedAt { get; set; }
        public int Months { get; set; }
        public ReportSummary Summary { get; set; } = new();
        public List<ReportBreakdownItem> TaskStatus { get; set; } = new();
        public List<ReportBreakdownItem> TaskPriority { get; set; } = new();
        public List<ReportBreakdownItem> ProjectStatus { get; set; } = new();
        public List<ReportBreakdownItem> DepartmentStatus { get; set; } = new();
        public List<ReportBreakdownItem> FollowUpStatus { get; set; } = new();
        public List<ReportTrendPoint> ActivityTrend { get; set; } = new();
        public List<ProjectPerformanceItem> ProjectPerformance { get; set; } = new();
        public List<UserWorkloadReportItem> UserWorkload { get; set; } = new();
    }

    public class ReportSummary
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
        public double TaskCompletionRate { get; set; }
    }

    public class ReportBreakdownItem
    {
        public string Name { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class ReportTrendPoint
    {
        public string Period { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int TasksCreated { get; set; }
        public int ProjectsCreated { get; set; }
        public int DepartmentsCreated { get; set; }
        public int PeopleCreated { get; set; }
        public int FollowUpsCreated { get; set; }
    }

    public class ProjectPerformanceItem
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double CompletionRate { get; set; }
    }

    public class UserWorkloadReportItem
    {
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public int OpenTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int DueSoonTasks { get; set; }
    }
}
