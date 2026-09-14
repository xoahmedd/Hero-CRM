using Domain.Entities.Collaborations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection.Emit;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure._Data.Configurations.CollaborationsConfigurations
{
    internal class AttachmentConfigurations : IEntityTypeConfiguration<Domain.Entities.Collaborations.Attachment>
    {
        public void Configure(EntityTypeBuilder<Attachment> builder)
        {
            builder.HasOne(a => a.TaskItem)
                   .WithMany(t => t.Attachments)
                   .HasForeignKey(a => a.TaskItemId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
