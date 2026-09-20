using System.Collections.Generic;
using Application.DTOs.Projects;
using Application.DTOs.Tasks.TaskItem;

namespace Application.DTOs.Dashboard
{
    public class DeveloperDashboardResponse
    {
        public int UserId { get; set; }
        public string DeveloperName { get; set; } = string.Empty;

        public int AssignedProjectsCount { get; set; }
        public int ActiveTasksCount { get; set; }
        public int CompletedTasksCount { get; set; }
        public int OverdueTasksCount { get; set; }
        public int UnreadNotificationsCount { get; set; }

        public List<ProjectResponse> AssignedProjects { get; set; } = new();
        public List<TaskResponse> UpcomingTasks { get; set; } = new();
        public List<OverdueItemSummary> PendingReasonSubmissions { get; set; } = new();
    }
}

