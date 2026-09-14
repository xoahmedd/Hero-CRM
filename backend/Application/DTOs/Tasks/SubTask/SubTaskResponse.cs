using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Tasks.SubTask
{
    public class SubTaskResponse
    {
        public int Id { get; set; }

        public int TaskItemId { get; set; }

        public string? TaskTitle { get; set; }

        public string Title { get; set; } = string.Empty;

        public bool IsCompleted { get; set; }

        public DateTime? DueDate { get; set; }
    }
}
