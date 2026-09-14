namespace Domain.Entities.Tasks
{
    public class TaskAssignee
    {
        public int TaskItemId { get; set; }
        public int UserId { get; set; }
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;


        public TaskItem TaskItem { get; set; } = null!;
    }
}
