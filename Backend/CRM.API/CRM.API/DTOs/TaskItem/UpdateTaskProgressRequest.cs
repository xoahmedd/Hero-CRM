namespace CRM.API.DTOs.TaskItem
{
    public class UpdateTaskProgressRequest
    {
        public string Status { get; set; } = string.Empty;
        public string? Note { get; set; }
    }
}
