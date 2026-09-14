using Microsoft.AspNetCore.Identity;

namespace Domain.Entities.Identity;

public class ApplicationRole : IdentityRole<int>
{
    public string? Description { get; set; }
}