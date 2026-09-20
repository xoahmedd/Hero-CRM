using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.SubTask
{
    public class UpdateSubTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        public DateTime? DueDate { get; set; }
    }
}