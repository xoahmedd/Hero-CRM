using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Department
{
    public class DepartmentResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Website { get; set; }
        public string Status { get; set; } = string.Empty;
        public int? OwnerId { get; set; }
        public string? OwnerName { get; set; }
        public int PeopleCount { get; set; }
        public int ProjectCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateDepartmentRequest
    {
        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [EmailAddress, MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(30)]
        public string? Phone { get; set; }

        [MaxLength(300)]
        public string? Address { get; set; }

        [Url, MaxLength(300)]
        public string? Website { get; set; }

        [Required, MaxLength(50)]
        public string Status { get; set; } = "Active";

        public int? OwnerId { get; set; }
    }

    public class UpdateDepartmentRequest : CreateDepartmentRequest
    {
    }

    public class DepartmentNoteResponse
    {
        public int Id { get; set; }
        public int DepartmentId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateDepartmentNoteRequest
    {
        [Required, MaxLength(4000)]
        public string Content { get; set; } = string.Empty;
    }

    public class DepartmentTagResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }
    }

    public class CreateDepartmentTagRequest
    {
        [Required, MaxLength(80)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Color { get; set; }
    }
}
