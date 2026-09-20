namespace CRM.API.Models
{
    public class TaskTag
    {
        public int TaskItemId { get; set; }

        public int TagId { get; set; }

        public TaskItem TaskItem { get; set; } = null!;

        public Tag Tag { get; set; } = null!;
    }
}