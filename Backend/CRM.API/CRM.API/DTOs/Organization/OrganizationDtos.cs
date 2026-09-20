using System.ComponentModel.DataAnnotations;

namespace CRM.API.DTOs.Organization
{
    public class OrganizationResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? Address { get; set; }
        public string? Website { get; set; }
        public string? LegacyNotes { get; set; }
        public string Status { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string? Region { get; set; }
        public int? OwnerId { get; set; }
        public string? OwnerName { get; set; }
        public int ContactCount { get; set; }
        public int ProjectCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateOrganizationRequest
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
        public string? LegacyNotes { get; set; }

        [Required, MaxLength(50)]
        public string Status { get; set; } = "Lead";

        [Required, MaxLength(50)]
        public string Type { get; set; } = "Other";

        [MaxLength(100)]
        public string? Region { get; set; }

        public int? OwnerId { get; set; }
    }

    public class UpdateOrganizationRequest : CreateOrganizationRequest
    {
    }

    public class ContactResponse
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public string OrganizationName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? JobTitle { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public bool IsPrimary { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateContactRequest
    {
        [Required]
        public int OrganizationId { get; set; }

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

    public class UpdateContactRequest
    {
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

    public class OrganizationNoteResponse
    {
        public int Id { get; set; }
        public int OrganizationId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateOrganizationNoteRequest
    {
        [Required, MaxLength(4000)]
        public string Content { get; set; } = string.Empty;
    }

    public class OrganizationTagResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Color { get; set; }
    }

    public class CreateOrganizationTagRequest
    {
        [Required, MaxLength(80)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(30)]
        public string? Color { get; set; }
    }
}
