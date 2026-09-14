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
    internal class TaskTagConfigurations : IEntityTypeConfiguration<TaskTag>
    {
        public void Configure(EntityTypeBuilder<TaskTag> builder)
        {

            builder.HasKey(tt => new { tt.TaskItemId, tt.TagId });

            builder.HasOne(tt => tt.TaskItem)
                   .WithMany(t => t.TaskTags)
                   .HasForeignKey(tt => tt.TaskItemId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(tt => tt.Tag)
                   .WithMany(t => t.TaskTags)
                   .HasForeignKey(tt => tt.TagId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
