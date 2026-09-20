using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Customer
{
    public class UpdateCustomerRequest
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [EmailAddress]
        [MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(30)]
        public string? Phone { get; set; }

        [MaxLength(150)]
        public string? Company { get; set; }

        [MaxLength(300)]
        public string? Address { get; set; }

        [MaxLength(50)]
        public string Status { get; set; } = "Lead";

        public string? Notes { get; set; }
    }
}