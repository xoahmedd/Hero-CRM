using Domain.Entities.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure._Data.Configurations.TasksConfigurations
{
    internal class TaskItemConfigurations : IEntityTypeConfiguration<TaskItem>
    {
        public void Configure(EntityTypeBuilder<TaskItem> builder)
        {
            builder.HasOne(t => t.Project)
                   .WithMany(p => p.Tasks)
                   .HasForeignKey(t => t.ProjectId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(t => t.ProjectId);

            builder.HasIndex(t => t.CreatedById);

            builder.Property(t => t.Status)
                   .HasConversion<string>()
                   .HasMaxLength(50);

            builder.Property(t => t.Priority)
                   .HasConversion<string>()
                   .HasMaxLength(20);

            builder.HasIndex(t => t.Status);

            builder.HasIndex(t => t.DueDate);

            builder.Property(t => t.MissedDeadlineReason)
                   .HasMaxLength(2000);
        }
    }
}
