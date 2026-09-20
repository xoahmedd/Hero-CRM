using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Tag
{
    public class CreateTagRequest
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Color { get; set; }
    }
}