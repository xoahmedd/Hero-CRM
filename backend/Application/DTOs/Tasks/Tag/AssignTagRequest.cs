using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Application.DTOs.Tasks.Tag
{
    public class AssignTagRequest
    {
        [Required]
        public int TaskItemId { get; set; }

        [Required]
        public int TagId { get; set; }
    }
}
