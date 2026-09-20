namespace CRM.API.Models
{
    public class OrganizationTagAssignment
    {
        public int OrganizationId { get; set; }

        public int TagId { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        public Customer Organization { get; set; } = null!;

        public OrganizationTag Tag { get; set; } = null!;
    }
}
