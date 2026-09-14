using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Common
{
    public class SubmitMissedReasonDto
    {
        [MaxLength(100)]
        public string Category { get; set; } = "Other";

        [Required]
        [MaxLength(2000)]
        public string Reason { get; set; } = string.Empty;
    }
}
