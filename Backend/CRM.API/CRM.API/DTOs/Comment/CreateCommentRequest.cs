using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Comment
{
    public class CreateCommentRequest
    {
        [Required]
        public int TaskItemId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }
}
