using Domain.Entities.Collaborations;
using Domain.Entities.Identity;
using Domain.Entities.Projects;
using Domain.Entities.Tasks;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace Infrastructure._Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, int>
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        }

        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }

        public DbSet<TaskItem> TaskItems { get; set; }
        public DbSet<SubTask> SubTasks { get; set; }
        public DbSet<TaskAssignee> TaskAssignees { get; set; }

        public DbSet<Tag> Tags { get; set; }
        public DbSet<TaskTag> TaskTags { get; set; }

        public DbSet<Comment> Comments { get; set; }
        public DbSet<Domain.Entities.Collaborations.Attachment> Attachments { get; set; }
        public DbSet<Domain.Entities.Collaborations.Activity> Activities { get; set; }
        public DbSet<Notification> Notifications { get; set; }
    }
}
