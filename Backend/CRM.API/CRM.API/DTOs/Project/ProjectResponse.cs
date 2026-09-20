namespace CRM.API.DTOs.Project
{
    public class ProjectResponse
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public string Status { get; set; } = string.Empty;

        public string Priority { get; set; } = string.Empty;

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public DateTime CreatedAt { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public int OwnerId { get; set; }

        public string? OwnerName { get; set; }

        public int? RequestedById { get; set; }

        public string? RequestedByName { get; set; }

        public int? CustomerId { get; set; }

        public string? CustomerName { get; set; }

        public int? TeamId { get; set; }

        public string? TeamName { get; set; }
    }
}