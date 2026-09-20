namespace CRM.API.DTOs.Tag
{
    public class TagResponse
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Color { get; set; }
    }
}