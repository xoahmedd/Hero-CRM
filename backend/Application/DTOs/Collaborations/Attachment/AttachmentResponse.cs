using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Collaborations.Attachment
{
    public class AttachmentResponse
    {
        public int Id { get; set; }

        public int TaskItemId { get; set; }

        public string? TaskTitle { get; set; }

        public string FileName { get; set; } = string.Empty;

        public string FileUrl { get; set; } = string.Empty;

        public string? ContentType { get; set; }

        public long? FileSize { get; set; }

        public DateTime UploadedAt { get; set; }
    }
}
