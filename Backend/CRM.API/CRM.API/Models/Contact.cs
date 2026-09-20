namespace CRM.API.Models
{
    public class Contact
    {
        public int Id { get; set; }

        public int OrganizationId { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? JobTitle { get; set; }

        public string? Email { get; set; }

        public string? Phone { get; set; }

        public bool IsPrimary { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public Customer Organization { get; set; } = null!;

        public ICollection<ContactNote> Notes { get; set; }
            = new List<ContactNote>();

        public ICollection<ContactTagAssignment> TagAssignments { get; set; }
            = new List<ContactTagAssignment>();
    }
}
