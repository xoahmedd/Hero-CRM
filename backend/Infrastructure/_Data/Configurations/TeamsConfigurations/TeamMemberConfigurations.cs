using Domain.Entities.Teams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure._Data.Configurations.TeamsConfigurations
{
    internal class TeamMemberConfigurations : IEntityTypeConfiguration<TeamMember>
    {
        public void Configure(EntityTypeBuilder<TeamMember> builder)
        {
            builder.HasKey(tm => new { tm.TeamId, tm.UserId });

            builder.HasOne(tm => tm.Team)
                   .WithMany(t => t.Members)
                   .HasForeignKey(tm => tm.TeamId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
