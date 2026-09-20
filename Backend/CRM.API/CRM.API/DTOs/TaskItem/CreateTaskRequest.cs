using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.TaskItem
{
    public class CreateTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Todo";

        [MaxLength(20)]
        public string Priority { get; set; } = "Medium";

        public int? ProjectId { get; set; }

        [Required]
        public int CreatedById { get; set; }

        public DateTime? DueDate { get; set; }
    }
}