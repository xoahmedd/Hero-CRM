using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Notification
{
    public class CreateNotificationRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Message { get; set; } = string.Empty;

        public string Type { get; set; } = "General";
    }
}