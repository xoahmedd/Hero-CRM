using Domain.Enums;

namespace Application.DTOs.Report
{
    public class ProjectPerformanceItem
    {
        public int ProjectId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public ProjectStatus Status { get; set; }
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int OverdueTasks { get; set; }
        public double CompletionRate { get; set; }
    }
}
