using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Teams
{
    public class UpdateTeamRequest
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }
    }
}
