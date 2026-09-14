using Domain.Entities.Tasks;

namespace Domain.Entities.Collaborations
{
    public class Comment : BaseEntity
    {
        public int TaskItemId { get; set; }
        public int UserId { get; set; }
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }


        public TaskItem TaskItem { get; set; } = null!;
    }
}
