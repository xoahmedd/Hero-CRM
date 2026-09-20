namespace CRM.API.Models
{
    // Legacy physical name: Customers. Hero CRM uses records with Type = "Department" as internal departments.
    // Keeping the physical table name preserves existing data and foreign keys while the public domain uses Departments.
    public class Customer
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string? Email { get; set; }

        public string? Phone { get; set; }

        // Kept for backward compatibility with data created before the IT department refactor.
        public string? Company { get; set; }

        public string? Address { get; set; }

        public string Status { get; set; } = "Lead";

        public string? Notes { get; set; }

        public string Type { get; set; } = "Other";

        public string? Region { get; set; }

        public string? Website { get; set; }

        public int? OwnerId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public User? Owner { get; set; }

        public ICollection<Project> Projects { get; set; }
            = new List<Project>();

        public ICollection<Contact> Contacts { get; set; }
            = new List<Contact>();

        public ICollection<OrganizationNote> OrganizationNotes { get; set; }
            = new List<OrganizationNote>();

        public ICollection<OrganizationTagAssignment> TagAssignments { get; set; }
            = new List<OrganizationTagAssignment>();
    }
}
