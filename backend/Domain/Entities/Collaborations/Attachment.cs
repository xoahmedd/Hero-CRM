using Domain.Entities.Tasks;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Collaborations
{
    public class Attachment : BaseEntity
    {
        public int TaskItemId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public string? ContentType { get; set; }
        public long? FileSize { get; set; }


        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public TaskItem TaskItem { get; set; } = null!;
    }
}
