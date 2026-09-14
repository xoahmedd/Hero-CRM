using Domain.Entities.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure._Data.Configurations.TasksConfigurations
{
    internal class SubTaskConfigurations : IEntityTypeConfiguration<SubTask>
    {
        public void Configure(EntityTypeBuilder<SubTask> builder)
        {
            builder.HasOne(st => st.TaskItem)
                   .WithMany(t => t.SubTasks)
                   .HasForeignKey(st => st.TaskItemId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
