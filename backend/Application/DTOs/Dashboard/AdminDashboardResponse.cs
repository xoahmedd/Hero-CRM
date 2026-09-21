using System.Collections.Generic;
using Application.DTOs.Projects;

namespace Application.DTOs.Dashboard
{
    public class AdminDashboardResponse
    {
        public int TotalProjects { get; set; }
        public int InProgressProjects { get; set; }
        public int FinishedProjects { get; set; }
        public int CancelledProjects { get; set; }
        public int OverdueProjects { get; set; }

        // Backward compatibility aliases
        public int WorkingProjects { get => InProgressProjects; set => InProgressProjects = value; }
        public int PendingProjects { get => InProgressProjects; set => InProgressProjects = value; }

        public int TotalTasks { get; set; }
        public int InProgressTasks { get; set; }
        public int AssignedTasks { get => InProgressTasks; set => InProgressTasks = value; }
        public int ReviewTasks { get; set; }
        public int InReviewTasks { get => ReviewTasks; set => ReviewTasks = value; }
        public int CompletedTasks { get; set; }
        public int FinishedTasks { get => CompletedTasks; set => CompletedTasks = value; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }

        public int TotalActiveDevelopers { get; set; }

        public List<DepartmentRequestSummary> DepartmentRequests { get; set; } = new();
        public List<DeveloperWorkloadSummary> DeveloperWorkloads { get; set; } = new();
        public List<OverdueItemSummary> OverdueItemsNeedingReason { get; set; } = new();
        public List<ProjectResponse> RecentProjects { get; set; } = new();
    }
}
