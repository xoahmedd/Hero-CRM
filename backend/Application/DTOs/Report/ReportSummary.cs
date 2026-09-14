namespace Application.DTOs.Report
{
    public class ReportSummary
    {
        public int TotalCustomers { get; set; }
        public int TotalProjects { get; set; }
        public int ActiveProjects { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }
        public int TotalUsers { get; set; }
        public double TaskCompletionRate { get; set; }
    }
}
