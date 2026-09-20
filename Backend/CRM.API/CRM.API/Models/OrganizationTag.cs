namespace CRM.API.Models
{
    public class OrganizationTag
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Color { get; set; }

        public string Scope { get; set; } = "Organization";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<OrganizationTagAssignment> Assignments { get; set; }
            = new List<OrganizationTagAssignment>();

        public ICollection<ContactTagAssignment> ContactAssignments { get; set; }
            = new List<ContactTagAssignment>();
    }
}
