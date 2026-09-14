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
    internal class TaskAssigneeConfigurations : IEntityTypeConfiguration<TaskAssignee>
    {
        public void Configure(EntityTypeBuilder<TaskAssignee> builder)
        {
            builder.HasKey(ta => new { ta.TaskItemId, ta.UserId });

            builder.HasOne(ta => ta.TaskItem)
                   .WithMany(t => t.Assignees)
                   .HasForeignKey(ta => ta.TaskItemId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
