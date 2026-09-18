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

        public int? TaskId
        {
            get => TaskItemId;
            set { if (value.HasValue) TaskItemId = value.Value; }
        }

        [Required]
        public int UserId { get; set; }

        public int? AuthorId
        {
            get => UserId;
            set { if (value.HasValue) UserId = value.Value; }
        }

        [Required]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }
}
