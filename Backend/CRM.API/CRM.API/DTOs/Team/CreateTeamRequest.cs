using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Team
{
    public class CreateTeamRequest
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        public int CreatedById { get; set; }
    }
}