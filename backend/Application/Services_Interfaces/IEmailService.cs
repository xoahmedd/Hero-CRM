using System.Threading.Tasks;

namespace Application.Services_Interfaces
{
    public interface IEmailService
    {
        bool IsConfigured { get; }

        Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string? textBody = null);

        Task<bool> SendNotificationEmailAsync(
            string toEmail,
            string recipientName,
            string title,
            string message,
            string? itemType = null,
            string? itemName = null,
            string? actionUrl = null);
    }
}

