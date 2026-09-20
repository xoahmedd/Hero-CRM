using Domain.Enums;

namespace Application.DTOs.Tasks.TaskItem
{
    public class UpdateTaskStatusDto
    {
        public TaskItemStatus? Status { get; set; }
    }
}

