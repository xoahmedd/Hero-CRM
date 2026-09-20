namespace CRM.API.Models
{
    public class Attachment
    {
        public int Id { get; set; }

        public int TaskItemId { get; set; }

        public string FileName { get; set; } = string.Empty;

        public string FileUrl { get; set; } = string.Empty;

        public string? ContentType { get; set; }

        public long? FileSize { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        public TaskItem TaskItem { get; set; } = null!;
    }
}