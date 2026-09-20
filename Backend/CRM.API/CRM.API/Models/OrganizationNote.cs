namespace CRM.API.Models
{
    public class OrganizationNote
    {
        public int Id { get; set; }

        public int OrganizationId { get; set; }

        public int UserId { get; set; }

        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public Customer Organization { get; set; } = null!;

        public User User { get; set; } = null!;
    }
}
