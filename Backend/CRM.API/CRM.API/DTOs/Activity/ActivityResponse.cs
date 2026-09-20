namespace CRM.API.DTOs.Activity
{
    public class ActivityResponse
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public string? UserName { get; set; }

        public string EntityType { get; set; } = string.Empty;

        public int EntityId { get; set; }

        public string Action { get; set; } = string.Empty;

        public string? Description { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}