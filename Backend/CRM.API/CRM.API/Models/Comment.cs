namespace CRM.API.Models
{
    public class Comment
    {
        public int Id { get; set; }

        public int TaskItemId { get; set; }

        public int UserId { get; set; }

        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public TaskItem TaskItem { get; set; } = null!;

        public User User { get; set; } = null!;
    }
}