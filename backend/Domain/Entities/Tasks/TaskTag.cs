using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Tasks
{
    public class TaskTag
    {
        public int TaskItemId { get; set; }
        public int TagId { get; set; }


        public TaskItem TaskItem { get; set; } = null!;
        public Tag Tag { get; set; } = null!;
    }
}
