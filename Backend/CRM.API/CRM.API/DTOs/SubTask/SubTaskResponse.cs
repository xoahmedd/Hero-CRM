namespace CRM.API.DTOs.SubTask
{
    public class SubTaskResponse
    {
        public int Id { get; set; }

        public int TaskItemId { get; set; }

        public string? TaskTitle { get; set; }

        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        public DateTime? DueDate { get; set; }
    }
}