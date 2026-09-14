using System;
using System.Collections.Generic;
using Application.DTOs.Projects;
using Application.DTOs.Tasks.TaskItem;

namespace Application.DTOs.Dashboard
{
    public class AdminDashboardResponse
    {
        public int TotalProjects { get; set; }
        public int PendingProjects { get; set; }
        public int WorkingProjects { get; set; }
        public int FinishedProjects { get; set; }
        public int OverdueProjects { get; set; }
        
        public int TotalTasks { get; set; }
        public int CompletedTasks { get; set; }
        public int PendingTasks { get; set; }
        public int OverdueTasks { get; set; }

        public int TotalActiveDevelopers { get; set; }

        public List<DepartmentRequestSummary> DepartmentRequests { get; set; } = new();
        public List<DeveloperWorkloadSummary> DeveloperWorkloads { get; set; } = new();
        public List<OverdueItemSummary> OverdueItemsNeedingReason { get; set; } = new();
        public List<ProjectResponse> RecentProjects { get; set; } = new();
    }

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

    public class DepartmentRequestSummary
    {
        public string DepartmentName { get; set; } = string.Empty;
        public int ProjectCount { get; set; }
    }

    public class DeveloperWorkloadSummary
    {
        public int DeveloperId { get; set; }
        public string DeveloperName { get; set; } = string.Empty;
        public int ActiveProjectsCount { get; set; }
        public int ActiveTasksCount { get; set; }
    }

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
