using Domain.Entities.Projects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure._Data.Configurations.ProjectsConfiguraions
{
    internal class ProjectConfigurations : IEntityTypeConfiguration<Project>
    {
        public void Configure(EntityTypeBuilder<Project> builder)
        {
            builder.HasIndex(p => p.OwnerId);

            builder.Property(p => p.Status)
                   .HasConversion<string>()
                   .HasMaxLength(50);

            builder.Property(p => p.Priority)
                   .HasConversion<string>()
                   .HasMaxLength(20);

            builder.Property(p => p.RequestingDepartment)
                   .HasMaxLength(100);

            builder.Property(p => p.RequestedBy)
                   .HasMaxLength(100);

            builder.Property(p => p.BusinessJustification)
                   .HasMaxLength(2000);

            builder.Property(p => p.RejectionReason)
                   .HasMaxLength(1000);

            builder.Property(p => p.MissedDeadlineReason)
                   .HasMaxLength(2000);

            builder.Property(p => p.ReasonCategory)
                   .HasMaxLength(100);
        }
    }
}
