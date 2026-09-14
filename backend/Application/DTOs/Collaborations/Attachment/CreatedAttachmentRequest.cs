using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Collaborations.Attachment
{
    public class CreateAttachmentRequest
    {
        [Required]
        public int TaskItemId { get; set; }

        [Required]
        [MaxLength(255)]
        public string FileName { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string FileUrl { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? ContentType { get; set; }

        public long? FileSize { get; set; }
    }
}
