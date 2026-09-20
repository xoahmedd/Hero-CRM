namespace CRM.API.DTOs
{
    public class UpdateProfileRequest
    {
        public string FullName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        public string? ProfileImage { get; set; }
    }
}
