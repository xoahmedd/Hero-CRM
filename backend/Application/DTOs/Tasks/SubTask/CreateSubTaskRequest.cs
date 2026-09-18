using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Tasks.SubTask
{
    public class CreateSubTaskRequest
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public int TaskItemId { get; set; }

        public int? TaskId
        {
            get => TaskItemId;
            set { if (value.HasValue) TaskItemId = value.Value; }
        }

        public DateTime? DueDate { get; set; }
    }
}
