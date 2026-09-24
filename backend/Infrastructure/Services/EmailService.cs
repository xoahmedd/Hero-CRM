using System;
using System.IO;
using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Text;
using System.Threading.Tasks;
using Application.Common;
using Application.Services_Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _settings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _logger = logger;
            var section = configuration.GetSection("EmailSettings");
            _settings = new EmailSettings
            {
                SmtpServer = section["SmtpServer"] ?? "smtp.gmail.com",
                SmtpPort = int.TryParse(section["SmtpPort"], out var port) ? port : 587,
                EnableSsl = !bool.TryParse(section["EnableSsl"], out var ssl) || ssl,
                SenderEmail = section["SenderEmail"] ?? "mahmoudmohammed9669@gmail.com",
                SenderName = section["SenderName"] ?? "Hero CRM",
                SenderPassword = section["SenderPassword"] ?? "",
                AppUrl = section["AppUrl"] ?? "http://localhost:5173",
                Enabled = !bool.TryParse(section["Enabled"], out var enabled) || enabled
            };
        }

        public bool IsConfigured => _settings.Enabled &&
                                    !string.IsNullOrWhiteSpace(_settings.SenderEmail) &&
                                    !string.IsNullOrWhiteSpace(_settings.SenderPassword) &&
                                    !_settings.SenderEmail.Contains("herocrm.com") &&
                                    _settings.SenderPassword != "YOUR_APP_PASSWORD_HERE";

        private string? ResolveLogoPath()
        {
            var candidates = new[]
            {
                Path.Combine(AppContext.BaseDirectory, "Assets", "hero-logo.png"),
                Path.Combine(Directory.GetCurrentDirectory(), "Assets", "hero-logo.png"),
                Path.Combine(Directory.GetCurrentDirectory(), "backend", "Hero-CRM", "Assets", "hero-logo.png"),
                Path.Combine(Directory.GetCurrentDirectory(), "backend", "Infrastructure", "Assets", "hero-logo.png"),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Assets", "hero-logo.png"),
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "backend", "Hero-CRM", "Assets", "hero-logo.png"),
                "/home/xoahmed/Desktop/HERO_CRM_FINAL/projectFinal/backend/Hero-CRM/Assets/hero-logo.png",
                "/home/xoahmed/Desktop/HERO_CRM_FINAL/projectFinal/backend/Infrastructure/Assets/hero-logo.png"
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    return path;
                }
            }
            return null;
        }

        public async Task<bool> SendEmailAsync(string toEmail, string subject, string htmlBody, string? textBody = null)
        {
            if (!_settings.Enabled)
            {
                _logger.LogInformation("[Email Service]: Email sending is disabled in configuration.");
                return false;
            }

            if (string.IsNullOrWhiteSpace(toEmail))
            {
                _logger.LogWarning("[Email Service]: Cannot send email without a valid recipient address.");
                return false;
            }

            // If SMTP credentials are not yet configured, log warning and exit
            if (!IsConfigured)
            {
                _logger.LogWarning(
                    "[Email Service (Dev Mode - Live SMTP Not Configured)] -> " +
                    "To: {ToEmail} | Subject: '{Subject}' | To deliver live emails to Gmail, please configure 'EmailSettings:SenderEmail' and your Google App Password in 'EmailSettings:SenderPassword' in appsettings.json.",
                    toEmail, subject);
                return false;
            }

            try
            {
                using var client = new SmtpClient(_settings.SmtpServer, _settings.SmtpPort)
                {
                    EnableSsl = _settings.EnableSsl,
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(_settings.SenderEmail, _settings.SenderPassword),
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 15000
                };

                using var mail = new MailMessage
                {
                    From = new MailAddress(_settings.SenderEmail, _settings.SenderName),
                    Subject = subject,
                    IsBodyHtml = true
                };

                mail.To.Add(toEmail);

                // Attach inline logo CID if available
                var logoPath = ResolveLogoPath();
                var htmlView = AlternateView.CreateAlternateViewFromString(htmlBody, Encoding.UTF8, MediaTypeNames.Text.Html);

                if (!string.IsNullOrEmpty(logoPath) && File.Exists(logoPath))
                {
                    var logoResource = new LinkedResource(logoPath, "image/png")
                    {
                        ContentId = "hero_logo",
                        TransferEncoding = TransferEncoding.Base64
                    };
                    htmlView.LinkedResources.Add(logoResource);
                }

                mail.AlternateViews.Add(htmlView);

                await client.SendMailAsync(mail);
                _logger.LogInformation("[Email Service]: Email successfully delivered to {ToEmail} with subject '{Subject}'", toEmail, subject);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Email Service]: Error sending email to {ToEmail} via {SmtpServer}:{SmtpPort}", toEmail, _settings.SmtpServer, _settings.SmtpPort);
                return false;
            }
        }

        public async Task<bool> SendNotificationEmailAsync(
            string toEmail,
            string recipientName,
            string title,
            string message,
            string? itemType = null,
            string? itemName = null,
            string? actionUrl = null)
        {
            var appUrl = !string.IsNullOrWhiteSpace(actionUrl) ? actionUrl : _settings.AppUrl;
            var subject = $"[Hero CRM] {title}";
            var html = GenerateNotificationHtml(recipientName, title, message, itemType, itemName, appUrl);
            return await SendEmailAsync(toEmail, subject, html);
        }

        private string GenerateNotificationHtml(
            string recipientName,
            string title,
            string message,
            string? itemType,
            string? itemName,
            string appUrl)
        {
            var itemSection = "";
            if (!string.IsNullOrWhiteSpace(itemName))
            {
                var label = !string.IsNullOrWhiteSpace(itemType) ? itemType.ToUpperInvariant() : "RELATED ITEM";
                itemSection = $@"
                <div style=""background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #1a3896; border-radius: 8px; padding: 14px 18px; margin: 20px 0 24px 0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);"">
                    <div style=""font-size: 11px; text-transform: uppercase; color: #4a8220; font-weight: 700; letter-spacing: 0.08em; margin-bottom: 4px;"">{label}</div>
                    <div style=""font-size: 16px; font-weight: 600; color: #1a3896;"">{WebUtility.HtmlEncode(itemName)}</div>
                </div>";
            }

            return $@"
<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""utf-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>{WebUtility.HtmlEncode(title)}</title>
</head>
<body style=""margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.5;"">
    <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background-color: #f8fafc; padding: 32px 16px;"">
        <tr>
            <td align=""center"">
                <!-- Main Container Card -->
                <table role=""presentation"" border=""0"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);"">
                    <!-- Brand Header with Official Hero Logo -->
                    <tr>
                        <td style=""background-color: #ffffff; padding: 28px 36px 22px 36px;"">
                            <img src=""cid:hero_logo"" alt=""Hero middle east &amp; africa"" style=""display: block; width: 250px; max-width: 100%; height: auto; border: 0;"" />
                        </td>
                    </tr>

                    <!-- Decorative Gradient Divider Bar -->
                    <tr>
                        <td style=""height: 3px; background: linear-gradient(90deg, #1a3896 0%, #4a8220 100%); line-height: 3px; font-size: 0;"">&nbsp;</td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style=""padding: 32px 36px;"">
                            <p style=""font-size: 15px; color: #64748b; margin: 0 0 16px 0;"">Hello <strong style=""color: #0f172a;"">{WebUtility.HtmlEncode(recipientName)}</strong>,</p>

                            <h1 style=""font-size: 19px; font-weight: 700; color: #0f172a; margin: 0 0 14px 0; line-height: 1.3;"">{WebUtility.HtmlEncode(title)}</h1>

                            <div style=""font-size: 15px; color: #334155; line-height: 1.6; margin: 0 0 20px 0; background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 16px 20px;"">
                                {WebUtility.HtmlEncode(message)}
                            </div>

                            {itemSection}

                            <table border=""0"" cellpadding=""0"" cellspacing=""0"" style=""margin: 28px 0 8px 0;"">
                                <tr>
                                    <td align=""center"" style=""border-radius: 8px; background-color: #1a3896;"">
                                        <a href=""{appUrl}"" target=""_blank"" style=""display: inline-block; padding: 12px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px; border: 1px solid #1a3896; box-shadow: 0 2px 4px rgba(26, 56, 150, 0.2);"">
                                            Open in Hero CRM &rarr;
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style=""font-size: 12px; color: #94a3b8; margin: 26px 0 0 0; font-family: monospace;"">
                                Sent at {CairoTimeHelper.Format(DateTime.UtcNow)}
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style=""background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 36px; text-align: center;"">
                            <p style=""font-size: 12px; font-weight: 600; color: #475569; margin: 0 0 4px 0;"">
                                Hero Middle East &amp; Africa
                            </p>
                            <p style=""font-size: 11px; color: #64748b; margin: 0 0 6px 0;"">
                                CRM &amp; Project Platform
                            </p>
                            <p style=""font-size: 11px; color: #94a3b8; margin: 0;"">
                                This is an automated notification. Please do not reply directly to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>";
        }
    }
}
