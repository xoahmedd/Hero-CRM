namespace CRM.API.DTOs.TaskItem
{
    public class TaskResponse
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public int? ProjectId { get; set; }

        public string? ProjectName { get; set; }

        public int CreatedById { get; set; }

        public string? CreatedByName { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}