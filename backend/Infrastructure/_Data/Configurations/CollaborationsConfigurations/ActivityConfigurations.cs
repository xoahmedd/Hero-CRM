using Domain.Entities.Collaborations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure._Data.Configurations.CollaborationsConfigurations
{
    internal class ActivityConfigurations : IEntityTypeConfiguration<Domain.Entities.Collaborations.Activity>
    {
        public void Configure(EntityTypeBuilder<Domain.Entities.Collaborations.Activity> builder)
        {
            builder.HasIndex(a => a.UserId);
        }
    }
}
