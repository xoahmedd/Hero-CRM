using Domain.Entities.Collaborations;
using Domain.Entities.Identity;
using Domain.Entities.Projects;
using Domain.Entities.Tasks;
using Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Infrastructure._Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager, RoleManager<ApplicationRole> roleManager)
        {
            // Normalize any legacy status values in database
            try
            {
                await context.Database.ExecuteSqlRawAsync(
                    "UPDATE [TaskItems] SET [Status] = 'Assigned' WHERE [Status] IN ('InProgress', 'Todo', 'In Progress', 'To Do', '0')"
                );
            }
            catch
            {
                // In case table does not exist yet
            }

            // Seed Roles
            string[] roles = new[] { "Admin", "Developer" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new ApplicationRole { Name = role });
                }
            }

            // Seed Users
            if (!await userManager.Users.AnyAsync())
            {
                var users = new List<(ApplicationUser User, string Role, string Password)>
                {
                    (new ApplicationUser { FullName = "Sarah Chen", Email = "sarah.chen@herocrm.com", UserName = "sarah.chen@herocrm.com", ProfileImage = "SC", IsActive = true }, "Admin", "Password123!"),
                    (new ApplicationUser { FullName = "James Okafor", Email = "james.okafor@herocrm.com", UserName = "james.okafor@herocrm.com", ProfileImage = "JO", IsActive = true }, "Developer", "Password123!"),
                    (new ApplicationUser { FullName = "Priya Mehta", Email = "priya.mehta@herocrm.com", UserName = "priya.mehta@herocrm.com", ProfileImage = "PM", IsActive = true }, "Developer", "Password123!"),
                    (new ApplicationUser { FullName = "Lucas Rivera", Email = "lucas.rivera@herocrm.com", UserName = "lucas.rivera@herocrm.com", ProfileImage = "LR", IsActive = true }, "Developer", "Password123!"),
                    (new ApplicationUser { FullName = "Elena Volkov", Email = "elena.volkov@herocrm.com", UserName = "elena.volkov@herocrm.com", ProfileImage = "EV", IsActive = false }, "Developer", "Password123!"),
                    (new ApplicationUser { FullName = "David Park", Email = "david.park@herocrm.com", UserName = "david.park@herocrm.com", ProfileImage = "DP", IsActive = true }, "Developer", "Password123!"),
                    (new ApplicationUser { FullName = "Aisha Nwosu", Email = "aisha.nwosu@herocrm.com", UserName = "aisha.nwosu@herocrm.com", ProfileImage = "AN", IsActive = true }, "Developer", "Password123!"),
                    (new ApplicationUser { FullName = "Marco Ferretti", Email = "marco.ferretti@herocrm.com", UserName = "marco.ferretti@herocrm.com", ProfileImage = "MF", IsActive = true }, "Developer", "Password123!"),
                };

                foreach (var u in users)
                {
                    var result = await userManager.CreateAsync(u.User, u.Password);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(u.User, u.Role);
                    }
                }
            }

            // Fetch users for references
            var adminUser = await userManager.FindByEmailAsync("sarah.chen@herocrm.com");
            var devJames = await userManager.FindByEmailAsync("james.okafor@herocrm.com");
            var devPriya = await userManager.FindByEmailAsync("priya.mehta@herocrm.com");
            var devLucas = await userManager.FindByEmailAsync("lucas.rivera@herocrm.com");
            var devDavid = await userManager.FindByEmailAsync("david.park@herocrm.com");
            var devMarco = await userManager.FindByEmailAsync("marco.ferretti@herocrm.com");

            // Seed Projects
            if (!await context.Projects.AnyAsync() && devJames != null)
            {
                var projects = new List<Project>
                {
                    new Project { Name = "Apex CRM Portal Redesign", Description = "Full redesign of customer portal with new UX patterns.", Status = ProjectStatus.InProgress, Priority = ProjectPriority.High, StartDate = DateTime.UtcNow.AddDays(-60), DueDate = DateTime.UtcNow.AddDays(30), OwnerId = devJames.Id, RequestingDepartment = "IT" },
                    new Project { Name = "NovaTech API Gateway", Description = "Build and deploy unified API gateway.", Status = ProjectStatus.InProgress, Priority = ProjectPriority.Urgent, StartDate = DateTime.UtcNow.AddDays(-45), DueDate = DateTime.UtcNow.AddDays(15), OwnerId = devPriya?.Id ?? devJames.Id, RequestingDepartment = "Engineering" },
                    new Project { Name = "HR Onboarding Automation", Description = "Automated onboarding workflow platform.", Status = ProjectStatus.InProgress, Priority = ProjectPriority.Medium, StartDate = DateTime.UtcNow.AddDays(-90), DueDate = DateTime.UtcNow.AddDays(-10), OwnerId = devLucas?.Id ?? devJames.Id, RequestingDepartment = "Human Resources" },
                    new Project { Name = "Meridian Compliance Dashboard", Description = "Real-time compliance monitoring dashboard.", Status = ProjectStatus.Finished, Priority = ProjectPriority.High, StartDate = DateTime.UtcNow.AddDays(-120), DueDate = DateTime.UtcNow.AddDays(-20), OwnerId = devJames.Id, RequestingDepartment = "Legal" },
                    new Project { Name = "EuroRetail Market Expansion", Description = "Platform localization for EU market launch.", Status = ProjectStatus.InProgress, Priority = ProjectPriority.High, StartDate = DateTime.UtcNow.AddDays(10), DueDate = DateTime.UtcNow.AddDays(100), OwnerId = devDavid?.Id ?? devJames.Id, RequestingDepartment = "Sales" },
                    new Project { Name = "Quantum Analytics Data Pipeline", Description = "ETL pipeline for analytics ingestion.", Status = ProjectStatus.InProgress, Priority = ProjectPriority.Medium, StartDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(60), OwnerId = devDavid?.Id ?? devJames.Id, RequestingDepartment = "Data Science" },
                    new Project { Name = "SkyBridge Fleet Tracker", Description = "GPS-integrated fleet management.", Status = ProjectStatus.Cancelled, Priority = ProjectPriority.High, StartDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(40), OwnerId = devLucas?.Id ?? devJames.Id, RequestingDepartment = "Operations" },
                    new Project { Name = "Internal Knowledge Base", Description = "Wiki-style internal knowledge base.", Status = ProjectStatus.Finished, Priority = ProjectPriority.Low, StartDate = DateTime.UtcNow.AddDays(-150), DueDate = DateTime.UtcNow.AddDays(-30), OwnerId = devMarco?.Id ?? devJames.Id, RequestingDepartment = "IT" }
                };
                await context.Projects.AddRangeAsync(projects);
                await context.SaveChangesAsync();
            }

            // Seed Project Members
            if (!await context.ProjectMembers.AnyAsync() && devJames != null)
            {
                var projApex = await context.Projects.FirstOrDefaultAsync(p => p.Name == "Apex CRM Portal Redesign");
                var projNova = await context.Projects.FirstOrDefaultAsync(p => p.Name == "NovaTech API Gateway");
                var projHr = await context.Projects.FirstOrDefaultAsync(p => p.Name == "HR Onboarding Automation");
                var projMeridian = await context.Projects.FirstOrDefaultAsync(p => p.Name == "Meridian Compliance Dashboard");
                var projEuro = await context.Projects.FirstOrDefaultAsync(p => p.Name == "EuroRetail Market Expansion");
                var projQuantum = await context.Projects.FirstOrDefaultAsync(p => p.Name == "Quantum Analytics Data Pipeline");
                var projSky = await context.Projects.FirstOrDefaultAsync(p => p.Name == "SkyBridge Fleet Tracker");
                var projWiki = await context.Projects.FirstOrDefaultAsync(p => p.Name == "Internal Knowledge Base");

                var memberMappings = new List<(Project? Proj, List<ApplicationUser?> Devs)>
                {
                    (projApex, new List<ApplicationUser?> { devJames, devPriya }),
                    (projNova, new List<ApplicationUser?> { devPriya, devMarco, devDavid }),
                    (projHr, new List<ApplicationUser?> { devLucas, devJames }),
                    (projMeridian, new List<ApplicationUser?> { devJames }),
                    (projEuro, new List<ApplicationUser?> { devDavid }),
                    (projQuantum, new List<ApplicationUser?> { devDavid, devPriya }),
                    (projSky, new List<ApplicationUser?> { devLucas }),
                    (projWiki, new List<ApplicationUser?> { devMarco, devJames })
                };

                foreach (var mapping in memberMappings)
                {
                    if (mapping.Proj == null) continue;
                    foreach (var dev in mapping.Devs)
                    {
                        if (dev == null) continue;
                        if (!await context.ProjectMembers.AnyAsync(pm => pm.ProjectId == mapping.Proj.Id && pm.UserId == dev.Id))
                        {
                            context.ProjectMembers.Add(new ProjectMember
                            {
                                ProjectId = mapping.Proj.Id,
                                UserId = dev.Id,
                                JoinedAt = DateTime.UtcNow
                            });
                        }
                    }
                }
                await context.SaveChangesAsync();
            }

            // Seed Tasks
            if (adminUser != null)
            {
                var proj1 = await context.Projects.FirstOrDefaultAsync(p => p.Name == "Apex CRM Portal Redesign");
                var proj2 = await context.Projects.FirstOrDefaultAsync(p => p.Name == "NovaTech API Gateway");
                var proj3 = await context.Projects.FirstOrDefaultAsync(p => p.Name == "HR Onboarding Automation");
                var proj5 = await context.Projects.FirstOrDefaultAsync(p => p.Name == "EuroRetail Market Expansion");

                var taskDefs = new List<(
                    string Title,
                    string Description,
                    TaskItemStatus Status,
                    TaskPriority Priority,
                    Project? Project,
                    DateTime DueDate,
                    List<ApplicationUser?> Assignees
                )>
                {
                    (
                        "Design new dashboard wireframes",
                        "Create high-fidelity wireframes for the updated admin dashboard layout.",
                        TaskItemStatus.Completed,
                        TaskPriority.High,
                        proj1,
                        DateTime.UtcNow.AddDays(-10),
                        new List<ApplicationUser?> { devJames }
                    ),
                    (
                        "Implement authentication middleware",
                        "JWT validation and refresh token logic for all API routes.",
                        TaskItemStatus.Completed,
                        TaskPriority.Urgent,
                        proj2,
                        DateTime.UtcNow.AddDays(-15),
                        new List<ApplicationUser?> { devPriya }
                    ),
                    (
                        "Build rate limiting service",
                        "Per-client API rate limiting with configurable thresholds and Redis backing.",
                        TaskItemStatus.Assigned,
                        TaskPriority.High,
                        proj2,
                        DateTime.UtcNow.AddDays(10),
                        new List<ApplicationUser?> { devPriya, devDavid }
                    ),
                    (
                        "Responsive mobile layout",
                        "Ensure all portal views are fully responsive down to 375px viewport.",
                        TaskItemStatus.Assigned,
                        TaskPriority.Medium,
                        proj1,
                        DateTime.UtcNow.AddDays(15),
                        new List<ApplicationUser?> { devJames }
                    ),
                    (
                        "Document upload workflow",
                        "Secure drag-and-drop document upload with virus scan and S3 storage.",
                        TaskItemStatus.Review,
                        TaskPriority.High,
                        proj3,
                        DateTime.UtcNow.AddDays(-5),
                        new List<ApplicationUser?> { devLucas }
                    ),
                    (
                        "Onboarding email triggers",
                        "Automated email sequence for new hire steps with configurable delays.",
                        TaskItemStatus.Assigned,
                        TaskPriority.Medium,
                        proj3,
                        DateTime.UtcNow.AddDays(5),
                        new List<ApplicationUser?> { devLucas }
                    ),
                    (
                        "API gateway load testing",
                        "Run k6 load tests up to 10k concurrent requests and document results.",
                        TaskItemStatus.Assigned,
                        TaskPriority.Urgent,
                        proj2,
                        DateTime.UtcNow.AddDays(18),
                        new List<ApplicationUser?> { devMarco }
                    ),
                    (
                        "EU GDPR compliance audit",
                        "Full review of data processing flows against GDPR Article 30 requirements.",
                        TaskItemStatus.Assigned,
                        TaskPriority.High,
                        proj5,
                        DateTime.UtcNow.AddDays(30),
                        new List<ApplicationUser?> { devDavid }
                    ),
                    (
                        "Customer portal SSO integration",
                        "SAML 2.0 SSO with Apex's existing identity provider.",
                        TaskItemStatus.Assigned,
                        TaskPriority.Urgent,
                        proj1,
                        DateTime.UtcNow.AddDays(20),
                        new List<ApplicationUser?> { devJames, devPriya }
                    ),
                    (
                        "Set up CI/CD pipeline",
                        "GitHub Actions pipeline with staging and production deployment gates.",
                        TaskItemStatus.Completed,
                        TaskPriority.High,
                        proj2,
                        DateTime.UtcNow.AddDays(-20),
                        new List<ApplicationUser?> { devMarco }
                    )
                };

                foreach (var def in taskDefs)
                {
                    if (def.Project == null) continue;

                    var existingTask = await context.TaskItems
                        .Include(t => t.Assignees)
                        .AsSplitQuery()
                        .FirstOrDefaultAsync(t => t.Title == def.Title);

                    if (existingTask == null)
                    {
                        var newTask = new TaskItem
                        {
                            Title = def.Title,
                            Description = def.Description,
                            Status = def.Status,
                            Priority = def.Priority,
                            ProjectId = def.Project.Id,
                            CreatedById = adminUser.Id,
                            DueDate = def.DueDate,
                            CreatedAt = DateTime.UtcNow.AddDays(-20),
                            Assignees = def.Assignees
                                .Where(u => u != null)
                                .Select(u => new TaskAssignee { UserId = u!.Id })
                                .ToList()
                        };
                        await context.TaskItems.AddAsync(newTask);
                    }
                    else
                    {
                        foreach (var u in def.Assignees.Where(u => u != null))
                        {
                            if (!existingTask.Assignees.Any(a => a.UserId == u!.Id))
                            {
                                existingTask.Assignees.Add(new TaskAssignee { UserId = u!.Id });
                            }
                        }
                    }
                }
                await context.SaveChangesAsync();
            }

            // Seed Comments
            if (!await context.Comments.AnyAsync() && adminUser != null)
            {
                var taskMobile = await context.TaskItems.FirstOrDefaultAsync(t => t.Title == "Responsive mobile layout");
                var taskRate = await context.TaskItems.FirstOrDefaultAsync(t => t.Title == "Build rate limiting service");
                var taskSso = await context.TaskItems.FirstOrDefaultAsync(t => t.Title == "Customer portal SSO integration");

                var comments = new List<Comment>();
                if (taskMobile != null && devJames != null)
                {
                    comments.Add(new Comment
                    {
                        TaskItemId = taskMobile.Id,
                        UserId = devJames.Id,
                        Content = "Mobile nav drawer complete, now focusing on table overflow on mobile viewports.",
                        CreatedAt = DateTime.UtcNow.AddDays(-2)
                    });
                    comments.Add(new Comment
                    {
                        TaskItemId = taskMobile.Id,
                        UserId = adminUser.Id,
                        Content = "Great progress! Make sure to test on smaller iPhone SE screens as well.",
                        CreatedAt = DateTime.UtcNow.AddDays(-2).AddHours(1)
                    });
                }
                if (taskRate != null && devPriya != null)
                {
                    comments.Add(new Comment
                    {
                        TaskItemId = taskRate.Id,
                        UserId = devPriya.Id,
                        Content = "Redis cluster configuration is verified in staging.",
                        CreatedAt = DateTime.UtcNow.AddDays(-4)
                    });
                }
                if (taskSso != null && devJames != null)
                {
                    comments.Add(new Comment
                    {
                        TaskItemId = taskSso.Id,
                        UserId = devJames.Id,
                        Content = "Waiting on Apex IT team to provide the SAML metadata XML.",
                        CreatedAt = DateTime.UtcNow.AddDays(-3)
                    });
                }
                if (comments.Any())
                {
                    await context.Comments.AddRangeAsync(comments);
                    await context.SaveChangesAsync();
                }
            }
        }
    }
}
