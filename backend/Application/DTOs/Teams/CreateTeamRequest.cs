using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Teams
{
    public class CreateTeamRequest
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        public int CreatedById { get; set; }
    }
}
