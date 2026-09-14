using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Collaborations.Comment
{
    public class CreateCommentRequest
    {
        [Required]
        public int TaskItemId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }
}
