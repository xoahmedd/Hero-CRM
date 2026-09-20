namespace CRM.API.DTOs.Comment
{
    public class CommentResponse
    {
        public int Id { get; set; }

        public int TaskItemId { get; set; }

        public string? TaskTitle { get; set; }

        public int UserId { get; set; }

        public string? UserName { get; set; }

        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }
    }
}