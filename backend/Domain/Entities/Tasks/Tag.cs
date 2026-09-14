using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities.Tasks
{
    public class Tag : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }


        public ICollection<TaskTag> TaskTags { get; set; }
            = new List<TaskTag>();
    }
}
