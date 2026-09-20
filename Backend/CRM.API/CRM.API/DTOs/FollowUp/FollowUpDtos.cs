using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.FollowUp
{
    public class FollowUpResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int OwnerId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public DateTime DueAt { get; set; }
        public string? Outcome { get; set; }
        public DateTime? CompletedAt { get; set; }
        public int? ContactId { get; set; }
        public string? ContactName { get; set; }
        public int? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public int? ProjectId { get; set; }
        public string? ProjectName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateFollowUpRequest
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string Type { get; set; } = "FollowUp";

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Range(1, int.MaxValue)]
        public int OwnerId { get; set; }

        public DateTime DueAt { get; set; }

        public int? ContactId { get; set; }
        public int? DepartmentId { get; set; }
        public int? ProjectId { get; set; }
    }

    public class UpdateFollowUpRequest : CreateFollowUpRequest
    {
        [Required, MaxLength(30)]
        public string Status { get; set; } = "Open";

        [MaxLength(2000)]
        public string? Outcome { get; set; }
    }

    public class CompleteFollowUpRequest
    {
        [MaxLength(2000)]
        public string? Outcome { get; set; }
    }
}
