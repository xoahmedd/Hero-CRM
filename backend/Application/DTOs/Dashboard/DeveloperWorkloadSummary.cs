namespace Application.DTOs.Dashboard
{
    public class DeveloperWorkloadSummary
    {
        public int DeveloperId { get; set; }
        public string DeveloperName { get; set; } = string.Empty;
        public int ActiveProjectsCount { get; set; }
        public int ActiveTasksCount { get; set; }
    }
}

