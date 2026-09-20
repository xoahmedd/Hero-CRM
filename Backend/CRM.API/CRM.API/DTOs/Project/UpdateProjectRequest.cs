using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Project
{
    public class UpdateProjectRequest
    {
        [Required]
        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Planning";

        [MaxLength(20)]
        public string Priority { get; set; } = "Medium";

        public DateTime? StartDate { get; set; }

        public DateTime? DueDate { get; set; }

        public int? CustomerId { get; set; }

        public int? TeamId { get; set; }

        [Required]
        public int OwnerId { get; set; }
    }
}