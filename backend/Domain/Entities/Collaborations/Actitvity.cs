namespace Domain.Entities.Collaborations
{
    public class Activity : BaseEntity
    {
        public int UserId { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public int EntityId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Description { get; set; }


        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
