using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Tag
{
    public class AssignTagRequest
    {
        [Required]
        public int TaskItemId { get; set; }

        [Required]
        public int TagId { get; set; }
    }
}