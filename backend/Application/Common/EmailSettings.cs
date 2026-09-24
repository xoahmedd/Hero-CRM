namespace Application.Common
{
    public class EmailSettings
    {
        public string SmtpServer { get; set; } = "smtp.gmail.com";
        public int SmtpPort { get; set; } = 587;
        public bool EnableSsl { get; set; } = true;
        public string SenderEmail { get; set; } = "notifications@herocrm.com";
        public string SenderName { get; set; } = "Hero CRM";
        public string SenderPassword { get; set; } = "";
        public string AppUrl { get; set; } = "http://localhost:5173";
        public bool Enabled { get; set; } = true;
    }
}

