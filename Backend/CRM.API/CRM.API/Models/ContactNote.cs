namespace CRM.API.Models
{
    public class ContactNote
    {
        public int Id { get; set; }

        public int ContactId { get; set; }

        public int UserId { get; set; }

        public string Content { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public Contact Contact { get; set; } = null!;

        public User User { get; set; } = null!;
    }
}