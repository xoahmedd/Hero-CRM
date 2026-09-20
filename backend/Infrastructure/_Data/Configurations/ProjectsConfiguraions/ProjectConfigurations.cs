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

            var projectStatusConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<Domain.Enums.ProjectStatus, string>(
                v => v.ToString(),
                v => (v == "Finished" || v == "Completed") ? Domain.Enums.ProjectStatus.Finished
                   : (v == "Cancelled" || v == "Canceled" || v == "Rejected") ? Domain.Enums.ProjectStatus.Cancelled
                   : Domain.Enums.ProjectStatus.InProgress
            );

            builder.Property(p => p.Status)
                   .HasConversion(projectStatusConverter)
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
