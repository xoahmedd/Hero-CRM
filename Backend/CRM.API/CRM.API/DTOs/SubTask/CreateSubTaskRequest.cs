using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.SubTask
{
    public class CreateSubTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public int TaskItemId { get; set; }

        public DateTime? DueDate { get; set; }
    }
}