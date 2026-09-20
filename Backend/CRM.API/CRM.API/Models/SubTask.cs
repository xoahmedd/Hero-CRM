namespace CRM.API.Models
{
    public class SubTask
    {
        public int Id { get; set; }

        public int TaskItemId { get; set; }

        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        public DateTime? DueDate { get; set; }

        public TaskItem TaskItem { get; set; } = null!;
    }
}