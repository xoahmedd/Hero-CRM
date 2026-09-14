namespace Application.DTOs.Report
{
    public class ReportTrendPoint
    {
        public string Period { get; set; } = string.Empty;
        public string Label { get; set; } = string.Empty;
        public int TasksCreated { get; set; }
        public int ProjectsCreated { get; set; }
        public int CustomersCreated { get; set; }
    }
}
