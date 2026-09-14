using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Projects
{
    public class RejectProjectRequestDto
    {
        [Required]
        [MaxLength(1000)]
        public string RejectionReason { get; set; } = string.Empty;
    }
}
