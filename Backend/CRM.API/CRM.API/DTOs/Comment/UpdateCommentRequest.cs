using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Comment
{
    public class UpdateCommentRequest
    {
        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }
}