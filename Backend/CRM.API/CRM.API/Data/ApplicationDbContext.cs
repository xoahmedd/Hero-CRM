using CRM.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<UserRole> UserRoles => Set<UserRole>();

        public DbSet<Team> Teams => Set<Team>();
        public DbSet<TeamMember> TeamMembers => Set<TeamMember>();


        public DbSet<Customer> Customers { get; set; }
        public DbSet<Contact> Contacts => Set<Contact>();

        public DbSet<ContactNote> ContactNotes => Set<ContactNote>();
        public DbSet<ContactTagAssignment> ContactTagAssignments => Set<ContactTagAssignment>();
        public DbSet<OrganizationNote> OrganizationNotes => Set<OrganizationNote>();
        public DbSet<OrganizationTag> OrganizationTags => Set<OrganizationTag>();
        public DbSet<OrganizationTagAssignment> OrganizationTagAssignments => Set<OrganizationTagAssignment>();

        public DbSet<Project> Projects => Set<Project>();
        public DbSet<ProjectMember> ProjectMembers => Set<ProjectMember>();

        public DbSet<TaskItem> TaskItems => Set<TaskItem>();
        public DbSet<TaskAssignee> TaskAssignees => Set<TaskAssignee>();

        public DbSet<SubTask> SubTasks => Set<SubTask>();

        public DbSet<Comment> Comments => Set<Comment>();

        public DbSet<Attachment> Attachments => Set<Attachment>();

        public DbSet<Tag> Tags => Set<Tag>();
        public DbSet<TaskTag> TaskTags => Set<TaskTag>();

        public DbSet<Notification> Notifications => Set<Notification>();

        public DbSet<FollowUp> FollowUps => Set<FollowUp>();

        public DbSet<Activity> Activities => Set<Activity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // =========================
            // User
            // =========================

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasOne(u => u.Department)
                .WithMany()
                .HasForeignKey(u => u.DepartmentId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.DepartmentId);

            // =========================
            // UserRole
            // =========================

            modelBuilder.Entity<UserRole>()
                .HasKey(ur => new { ur.UserId, ur.RoleId });

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // Team
            // =========================

            modelBuilder.Entity<Team>()
                .HasOne(t => t.CreatedBy)
                .WithMany()
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // =========================
            // TeamMember
            // =========================

            modelBuilder.Entity<TeamMember>()
                .HasKey(tm => new { tm.TeamId, tm.UserId });

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(tm => tm.TeamId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TeamMember>()
                .HasOne(tm => tm.User)
                .WithMany(u => u.TeamMemberships)
                .HasForeignKey(tm => tm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // Customer
            // =========================

            modelBuilder.Entity<Customer>()
                .Property(c => c.Type)
                .HasMaxLength(50);

            modelBuilder.Entity<Customer>()
                .Property(c => c.Region)
                .HasMaxLength(100);

            modelBuilder.Entity<Customer>()
                .Property(c => c.Website)
                .HasMaxLength(300);



            modelBuilder.Entity<Customer>()
                .Property(c => c.Description)
                .HasMaxLength(1000); 


            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.Email);

            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.Status);


            modelBuilder.Entity<Customer>()
                .Property(c => c.Status)
                .HasMaxLength(50);

            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.Type);

            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.Region);

            modelBuilder.Entity<Customer>()
                .HasIndex(c => c.OwnerId);

            modelBuilder.Entity<Customer>()
                .HasOne(c => c.Owner)
                .WithMany()
                .HasForeignKey(c => c.OwnerId)
                .OnDelete(DeleteBehavior.SetNull);

            // =========================
            // Contact / People
            // =========================

            modelBuilder.Entity<Contact>()
                .Property(c => c.Name)
                .HasMaxLength(150);

            modelBuilder.Entity<Contact>()
                .Property(c => c.JobTitle)
                .HasMaxLength(150);

            modelBuilder.Entity<Contact>()
                .Property(c => c.Email)
                .HasMaxLength(150);

            modelBuilder.Entity<Contact>()
                .Property(c => c.Phone)
                .HasMaxLength(30);

            modelBuilder.Entity<Contact>()
                .HasOne(c => c.Organization)
                .WithMany(o => o.Contacts)
                .HasForeignKey(c => c.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Contact>()
                .HasIndex(c => c.OrganizationId);

            modelBuilder.Entity<Contact>()
                .HasIndex(c => c.Email);

            modelBuilder.Entity<Contact>()
                .HasIndex(c => c.Name);

            // =========================
            // Contact Notes
            // =========================

            modelBuilder.Entity<ContactNote>()
                .Property(n => n.Content)
                .HasMaxLength(4000);

            modelBuilder.Entity<ContactNote>()
                .HasOne(n => n.Contact)
                .WithMany(c => c.Notes)
                .HasForeignKey(n => n.ContactId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ContactNote>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ContactNote>()
                .HasIndex(n => new { n.ContactId, n.CreatedAt });

            modelBuilder.Entity<ContactNote>()
                .HasIndex(n => n.UserId);

            // =========================
            // Contact Tags
            // =========================

            modelBuilder.Entity<ContactTagAssignment>()
                .HasKey(a => new { a.ContactId, a.TagId });

            modelBuilder.Entity<ContactTagAssignment>()
                .HasOne(a => a.Contact)
                .WithMany(c => c.TagAssignments)
                .HasForeignKey(a => a.ContactId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ContactTagAssignment>()
                .HasOne(a => a.Tag)
                .WithMany(t => t.ContactAssignments)
                .HasForeignKey(a => a.TagId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ContactTagAssignment>()
                .HasIndex(a => a.TagId);

            // =========================
            // Organization Notes
            // =========================

            modelBuilder.Entity<OrganizationNote>()
                .Property(n => n.Content)
                .HasMaxLength(4000);

            modelBuilder.Entity<OrganizationNote>()
                .HasOne(n => n.Organization)
                .WithMany(o => o.OrganizationNotes)
                .HasForeignKey(n => n.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrganizationNote>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<OrganizationNote>()
                .HasIndex(n => new { n.OrganizationId, n.CreatedAt });

            // =========================
            // Organization Tags
            // =========================

            modelBuilder.Entity<OrganizationTag>()
                .Property(t => t.Name)
                .HasMaxLength(80);

            modelBuilder.Entity<OrganizationTag>()
                .Property(t => t.Color)
                .HasMaxLength(30);

            modelBuilder.Entity<OrganizationTag>()
                .Property(t => t.Scope)
                .HasMaxLength(30)
                .HasDefaultValue("Organization");

            modelBuilder.Entity<OrganizationTag>()
                .HasIndex(t => new { t.Scope, t.Name })
                .IsUnique();

            modelBuilder.Entity<OrganizationTagAssignment>()
                .HasKey(a => new { a.OrganizationId, a.TagId });

            modelBuilder.Entity<OrganizationTagAssignment>()
                .HasOne(a => a.Organization)
                .WithMany(o => o.TagAssignments)
                .HasForeignKey(a => a.OrganizationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrganizationTagAssignment>()
                .HasOne(a => a.Tag)
                .WithMany(t => t.Assignments)
                .HasForeignKey(a => a.TagId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<OrganizationTagAssignment>()
                .HasIndex(a => a.TagId);

            // =========================
            // Project
            // =========================

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Owner)
                .WithMany(u => u.OwnedProjects)
                .HasForeignKey(p => p.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Customer)
                .WithMany(c => c.Projects)
                .HasForeignKey(p => p.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.RequestedBy)
                .WithMany(u => u.RequestedProjects)
                .HasForeignKey(p => p.RequestedById)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Team)
                .WithMany(t => t.Projects)
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.SetNull);

            // =========================
            // ProjectMember
            // =========================

            modelBuilder.Entity<ProjectMember>()
                .HasKey(pm => new { pm.ProjectId, pm.UserId });

            modelBuilder.Entity<ProjectMember>()
                .HasOne(pm => pm.Project)
                .WithMany(p => p.Members)
                .HasForeignKey(pm => pm.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectMember>()
                .HasOne(pm => pm.User)
                .WithMany(u => u.ProjectMemberships)
                .HasForeignKey(pm => pm.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // Task
            // =========================

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Project)
                .WithMany(p => p.Tasks)
                .HasForeignKey(t => t.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.CreatedBy)
                .WithMany(u => u.CreatedTasks)
                .HasForeignKey(t => t.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);

            // =========================
            // TaskAssignee
            // =========================

            modelBuilder.Entity<TaskAssignee>()
                .HasKey(ta => new { ta.TaskItemId, ta.UserId });

            modelBuilder.Entity<TaskAssignee>()
                .HasOne(ta => ta.TaskItem)
                .WithMany(t => t.Assignees)
                .HasForeignKey(ta => ta.TaskItemId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskAssignee>()
                .HasOne(ta => ta.User)
                .WithMany(u => u.TaskAssignments)
                .HasForeignKey(ta => ta.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // SubTask
            // =========================

            modelBuilder.Entity<SubTask>()
                .HasOne(st => st.TaskItem)
                .WithMany(t => t.SubTasks)
                .HasForeignKey(st => st.TaskItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // Comment
            // =========================

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.TaskItem)
                .WithMany(t => t.Comments)
                .HasForeignKey(c => c.TaskItemId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Comment>()
                .HasOne(c => c.User)
                .WithMany(u => u.Comments)
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // =========================
            // Attachment
            // =========================

            modelBuilder.Entity<Attachment>()
                .HasOne(a => a.TaskItem)
                .WithMany(t => t.Attachments)
                .HasForeignKey(a => a.TaskItemId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // TaskTag
            // =========================

            modelBuilder.Entity<TaskTag>()
                .HasKey(tt => new { tt.TaskItemId, tt.TagId });

            modelBuilder.Entity<TaskTag>()
                .HasOne(tt => tt.TaskItem)
                .WithMany(t => t.TaskTags)
                .HasForeignKey(tt => tt.TaskItemId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TaskTag>()
                .HasOne(tt => tt.Tag)
                .WithMany(t => t.TaskTags)
                .HasForeignKey(tt => tt.TagId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // CRM Follow-Up
            // =========================

            modelBuilder.Entity<FollowUp>()
                .Property(f => f.Title)
                .HasMaxLength(200);

            modelBuilder.Entity<FollowUp>()
                .Property(f => f.Type)
                .HasMaxLength(50);

            modelBuilder.Entity<FollowUp>()
                .Property(f => f.Status)
                .HasMaxLength(30);

            modelBuilder.Entity<FollowUp>()
                .Property(f => f.Description)
                .HasMaxLength(2000);

            modelBuilder.Entity<FollowUp>()
                .Property(f => f.Outcome)
                .HasMaxLength(2000);

            modelBuilder.Entity<FollowUp>()
                .HasOne(f => f.Owner)
                .WithMany()
                .HasForeignKey(f => f.OwnerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<FollowUp>()
                .HasOne(f => f.Contact)
                .WithMany()
                .HasForeignKey(f => f.ContactId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<FollowUp>()
                .HasOne(f => f.Department)
                .WithMany()
                .HasForeignKey(f => f.DepartmentId)
                // SQL Server rejects SET NULL here because Customers already reaches
                // FollowUps through Contacts, creating multiple cascade paths.
                // Department deletion explicitly clears this optional reference first.
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<FollowUp>()
                .HasOne(f => f.Project)
                .WithMany()
                .HasForeignKey(f => f.ProjectId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<FollowUp>()
                .HasIndex(f => new { f.OwnerId, f.Status, f.DueAt });

            modelBuilder.Entity<FollowUp>()
                .HasIndex(f => f.ContactId);

            modelBuilder.Entity<FollowUp>()
                .HasIndex(f => f.DepartmentId);

            modelBuilder.Entity<FollowUp>()
                .HasIndex(f => f.ProjectId);

            // =========================
            // Notification
            // =========================

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // =========================
            // Activity
            // =========================

            modelBuilder.Entity<Activity>()
                .HasOne(a => a.User)
                .WithMany(u => u.Activities)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // =========================
            // Seed Roles
            // =========================

            modelBuilder.Entity<Role>().HasData(
                new Role
                {
                    Id = 1,
                    Name = "Admin",
                    Description = "System administrator"
                },
                new Role
                {
                    Id = 2,
                    Name = "Developer",
                    Description = "Developer who works on assigned tasks and projects"
                },
                new Role
                {
                    Id = 3,
                    Name = "User",
                    Description = "Workspace requester who can submit tasks and project requests"
                }
            );


            modelBuilder.Entity<Project>()
                .HasIndex(p => p.CustomerId);

            modelBuilder.Entity<Project>()
                .HasIndex(p => p.OwnerId);

            modelBuilder.Entity<Project>()
                .HasIndex(p => p.RequestedById);

            modelBuilder.Entity<Project>()
                .HasIndex(p => p.TeamId);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.ProjectId);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.CreatedById);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.Status);

            modelBuilder.Entity<TaskItem>()
                .HasIndex(t => t.DueDate);

            modelBuilder.Entity<Comment>()
                .HasIndex(c => c.TaskItemId);

            modelBuilder.Entity<Notification>()
                .HasIndex(n => new { n.UserId, n.IsRead });
        }
    }
}