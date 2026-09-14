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
    internal class NotificationConfigurations : IEntityTypeConfiguration<Notification>
    {
        public void Configure(EntityTypeBuilder<Notification> builder)
        {
            builder.Property(n => n.Type)
                   .HasConversion<string>()
                   .HasMaxLength(50);

            builder.HasIndex(n => new { n.UserId, n.IsRead });
            builder.HasIndex(n => n.ProjectId);
            builder.HasIndex(n => n.TaskId);
        }
    }
}
