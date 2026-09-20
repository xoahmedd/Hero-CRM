namespace CRM.API.Models
{
    public class ContactTagAssignment
    {
        public int ContactId { get; set; }

        public int TagId { get; set; }

        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        public Contact Contact { get; set; } = null!;

        public OrganizationTag Tag { get; set; } = null!;
    }
}