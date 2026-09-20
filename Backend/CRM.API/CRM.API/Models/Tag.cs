namespace CRM.API.Models
{
    public class Tag
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Color { get; set; }

        public ICollection<TaskTag> TaskTags { get; set; }
            = new List<TaskTag>();
    }
}