using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.People
{
    public class PersonResponse
    {
        public int Id { get; set; }
        public int DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public bool IsPrimary { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class PersonDetailsResponse : PersonResponse
    {
        public int NoteCount { get; set; }
        public int TagCount { get; set; }
        public int RelatedProjectCount { get; set; }
    }

    public class CreatePersonRequest
    {
        [Range(1, int.MaxValue)]
        public int DepartmentId { get; set; }

        [Required, MaxLength(150)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(150)]
        public string? JobTitle { get; set; }

        [EmailAddress, MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(30)]
        public string? Phone { get; set; }

        public bool IsPrimary { get; set; }
    }

    public class UpdatePersonRequest : CreatePersonRequest
    {
    }

    public class CreatePersonNoteRequest
    {
        [Required, MaxLength(4000)]
        public string Content { get; set; } = string.Empty;
    }

    public class PersonNoteResponse
    {
        public int Id { get; set; }
        public int PersonId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreatePersonTagRequest
    {
        [Required, MaxLength(80)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Color { get; set; }
    }

    public class PersonTagResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }
    }

    public class PersonProjectResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Priority { get; set; } = string.Empty;
        public DateTime? StartDate { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class PersonActivityResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
