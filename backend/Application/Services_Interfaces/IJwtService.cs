using Domain.Entities.Identity;
using System.Collections.Generic;

namespace Application.Services_Interfaces
{
    public interface IJwtService
    {
        string GenerateToken(ApplicationUser user, IEnumerable<string> roles);
    }
}

