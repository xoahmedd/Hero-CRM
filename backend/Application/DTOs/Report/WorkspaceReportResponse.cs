using System;
using System.Collections.Generic;

namespace Application.DTOs.Report
{
    public class WorkspaceReportResponse
    {
        public DateTime GeneratedAt { get; set; }
        public int Months { get; set; }
        public ReportSummary Summary { get; set; } = new();
        public List<ReportBreakdownItem> TaskStatus { get; set; } = new();
        public List<ReportBreakdownItem> TaskPriority { get; set; } = new();
        public List<ReportBreakdownItem> ProjectStatus { get; set; } = new();
        public List<ReportBreakdownItem> CustomerStatus { get; set; } = new();
        public List<ReportTrendPoint> ActivityTrend { get; set; } = new();
        public List<ProjectPerformanceItem> ProjectPerformance { get; set; } = new();
    }
}
