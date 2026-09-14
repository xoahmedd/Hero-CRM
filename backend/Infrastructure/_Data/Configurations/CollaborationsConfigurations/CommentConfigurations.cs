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
    internal class CommentConfigurations : IEntityTypeConfiguration<Comment>
    {
        public void Configure(EntityTypeBuilder<Comment> builder)
        {
            builder.HasOne(c => c.TaskItem)
                   .WithMany(t => t.Comments)
                   .HasForeignKey(c => c.TaskItemId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(c => c.TaskItemId);
        }
    }
}
