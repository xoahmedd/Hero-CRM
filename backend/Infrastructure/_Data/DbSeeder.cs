using Domain.Entities.Collaborations;
using Domain.Entities.Customers;
using Domain.Entities.Identity;
using Domain.Entities.Projects;
using Domain.Entities.Tasks;
using Domain.Entities.Teams;
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

            // Seed Customers
            if (!await context.Customers.AnyAsync())
            {
                var customers = new List<Customer>
                {
                    new Customer { Name = "Thomas Blackwell", Company = "Apex Dynamics", Email = "t.blackwell@apexdyn.com", Phone = "+1 555-0192", Address = "42 Innovation Blvd, Austin TX", Status = CustomerStatus.Active, Notes = "Key enterprise account, quarterly review Q4." },
                    new Customer { Name = "Maria Santos", Company = "NovaTech Solutions", Email = "m.santos@novatech.io", Phone = "+1 555-0284", Address = "88 Harbor Dr, San Francisco CA", Status = CustomerStatus.Active, Notes = "Interested in expanded API licensing." },
                    new Customer { Name = "Yuki Tanaka", Company = "SkyBridge Logistics", Email = "y.tanaka@skybridge.jp", Phone = "+81 3-5555-0142", Address = "12-5 Shibuya, Tokyo", Status = CustomerStatus.Lead, Notes = "Warm lead from TechSummit 2026." },
                    new Customer { Name = "Omar Hassan", Company = "Meridian Financial", Email = "o.hassan@meridianfin.com", Phone = "+1 555-0376", Address = "200 Wall St, New York NY", Status = CustomerStatus.Inactive, Notes = "Contract renewal pending compliance review." },
                    new Customer { Name = "Claire Dupont", Company = "EuroRetail Group", Email = "c.dupont@euroretail.fr", Phone = "+33 1 5555 0421", Address = "15 Rue du Commerce, Paris", Status = CustomerStatus.Active, Notes = "Expanding to 3 new EU markets." },
                    new Customer { Name = "Raj Patel", Company = "Quantum Analytics", Email = "r.patel@quantumanaly.com", Phone = "+1 555-0558", Address = "301 Data Center Way, Seattle WA", Status = CustomerStatus.Lead, Notes = "Evaluation period starts October." },
                    new Customer { Name = "Sophie Williams", Company = "GreenPath Energy", Email = "s.williams@greenpath.co", Phone = "+44 20 5555 0619", Address = "7 Canary Wharf, London", Status = CustomerStatus.Archived, Notes = "Project cancelled; contact retained." }
                };
                await context.Customers.AddRangeAsync(customers);
                await context.SaveChangesAsync();
            }

            // Fetch users & customers for references
            var adminUser = await userManager.FindByEmailAsync("sarah.chen@herocrm.com");
            var devJames = await userManager.FindByEmailAsync("james.okafor@herocrm.com");
            var devPriya = await userManager.FindByEmailAsync("priya.mehta@herocrm.com");
            var devLucas = await userManager.FindByEmailAsync("lucas.rivera@herocrm.com");
            var devDavid = await userManager.FindByEmailAsync("david.park@herocrm.com");
            var devMarco = await userManager.FindByEmailAsync("marco.ferretti@herocrm.com");
            var custApex = await context.Customers.FirstOrDefaultAsync(c => c.Company == "Apex Dynamics");
            var custNova = await context.Customers.FirstOrDefaultAsync(c => c.Company == "NovaTech Solutions");
            var custSky = await context.Customers.FirstOrDefaultAsync(c => c.Company == "SkyBridge Logistics");
            var custMeridian = await context.Customers.FirstOrDefaultAsync(c => c.Company == "Meridian Financial");
            var custEuro = await context.Customers.FirstOrDefaultAsync(c => c.Company == "EuroRetail Group");
            var custQuantum = await context.Customers.FirstOrDefaultAsync(c => c.Company == "Quantum Analytics");

            // Seed Projects
            if (!await context.Projects.AnyAsync() && devJames != null)
            {
                var projects = new List<Project>
                {
                    new Project { Name = "Apex CRM Portal Redesign", Description = "Full redesign of customer portal with new UX patterns.", Status = ProjectStatus.Working, Priority = ProjectPriority.High, StartDate = DateTime.UtcNow.AddDays(-60), DueDate = DateTime.UtcNow.AddDays(30), OwnerId = devJames.Id, CustomerId = custApex?.Id, RequestingDepartment = "IT" },
                    new Project { Name = "NovaTech API Gateway", Description = "Build and deploy unified API gateway.", Status = ProjectStatus.Working, Priority = ProjectPriority.Urgent, StartDate = DateTime.UtcNow.AddDays(-45), DueDate = DateTime.UtcNow.AddDays(15), OwnerId = devPriya?.Id ?? devJames.Id, CustomerId = custNova?.Id, RequestingDepartment = "Engineering" },
                    new Project { Name = "HR Onboarding Automation", Description = "Automated onboarding workflow platform.", Status = ProjectStatus.Overdue, Priority = ProjectPriority.Medium, StartDate = DateTime.UtcNow.AddDays(-90), DueDate = DateTime.UtcNow.AddDays(-10), OwnerId = devLucas?.Id ?? devJames.Id, CustomerId = custApex?.Id, RequestingDepartment = "Human Resources" },
                    new Project { Name = "Meridian Compliance Dashboard", Description = "Real-time compliance monitoring dashboard.", Status = ProjectStatus.Finished, Priority = ProjectPriority.High, StartDate = DateTime.UtcNow.AddDays(-120), DueDate = DateTime.UtcNow.AddDays(-20), OwnerId = devJames.Id, CustomerId = custMeridian?.Id, RequestingDepartment = "Legal" },
                    new Project { Name = "EuroRetail Market Expansion", Description = "Platform localization for EU market launch.", Status = ProjectStatus.Planning, Priority = ProjectPriority.High, StartDate = DateTime.UtcNow.AddDays(10), DueDate = DateTime.UtcNow.AddDays(100), OwnerId = devDavid?.Id ?? devJames.Id, CustomerId = custEuro?.Id, RequestingDepartment = "Sales" },
                    new Project { Name = "Quantum Analytics Data Pipeline", Description = "ETL pipeline for analytics ingestion.", Status = ProjectStatus.Planning, Priority = ProjectPriority.Medium, StartDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(60), OwnerId = devDavid?.Id ?? devJames.Id, CustomerId = custQuantum?.Id, RequestingDepartment = "Data Science" },
                    new Project { Name = "SkyBridge Fleet Tracker", Description = "GPS-integrated fleet management.", Status = ProjectStatus.Planning, Priority = ProjectPriority.High, StartDate = DateTime.UtcNow, DueDate = DateTime.UtcNow.AddDays(40), OwnerId = devLucas?.Id ?? devJames.Id, CustomerId = custSky?.Id, RequestingDepartment = "Operations" },
                    new Project { Name = "Internal Knowledge Base", Description = "Wiki-style internal knowledge base.", Status = ProjectStatus.Finished, Priority = ProjectPriority.Low, StartDate = DateTime.UtcNow.AddDays(-150), DueDate = DateTime.UtcNow.AddDays(-30), OwnerId = devMarco?.Id ?? devJames.Id, CustomerId = custApex?.Id, RequestingDepartment = "IT" }
                };
                await context.Projects.AddRangeAsync(projects);
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
                    List<ApplicationUser?> Assignees,
                    List<(string Title, bool IsCompleted)>? SubTasks
                )>
                {
                    (
                        "Design new dashboard wireframes",
                        "Create high-fidelity wireframes for the updated admin dashboard layout.",
                        TaskItemStatus.Completed,
                        TaskPriority.High,
                        proj1,
                        DateTime.UtcNow.AddDays(-10),
                        new List<ApplicationUser?> { devJames },
                        null
                    ),
                    (
                        "Implement authentication middleware",
                        "JWT validation and refresh token logic for all API routes.",
                        TaskItemStatus.Completed,
                        TaskPriority.Urgent,
                        proj2,
                        DateTime.UtcNow.AddDays(-15),
                        new List<ApplicationUser?> { devPriya },
                        null
                    ),
                    (
                        "Build rate limiting service",
                        "Per-client API rate limiting with configurable thresholds and Redis backing.",
                        TaskItemStatus.Assigned,
                        TaskPriority.High,
                        proj2,
                        DateTime.UtcNow.AddDays(10),
                        new List<ApplicationUser?> { devPriya, devDavid },
                        new List<(string, bool)>
                        {
                            ("Design Redis schema", true),
                            ("Implement token bucket algorithm", false),
                            ("Write unit tests for sliding window", false)
                        }
                    ),
                    (
                        "Responsive mobile layout",
                        "Ensure all portal views are fully responsive down to 375px viewport.",
                        TaskItemStatus.Assigned,
                        TaskPriority.Medium,
                        proj1,
                        DateTime.UtcNow.AddDays(15),
                        new List<ApplicationUser?> { devJames },
                        new List<(string, bool)>
                        {
                            ("Audit current breakpoint behavior", true),
                            ("Implement responsive nav drawer", true),
                            ("Fix table overflow on mobile", false),
                            ("Test on iOS Safari and Chrome Android", false)
                        }
                    ),
                    (
                        "Document upload workflow",
                        "Secure drag-and-drop document upload with virus scan and S3 storage.",
                        TaskItemStatus.Review,
                        TaskPriority.High,
                        proj3,
                        DateTime.UtcNow.AddDays(-5),
                        new List<ApplicationUser?> { devLucas },
                        null
                    ),
                    (
                        "Onboarding email triggers",
                        "Automated email sequence for new hire steps with configurable delays.",
                        TaskItemStatus.Assigned,
                        TaskPriority.Medium,
                        proj3,
                        DateTime.UtcNow.AddDays(5),
                        new List<ApplicationUser?> { devLucas },
                        null
                    ),
                    (
                        "API gateway load testing",
                        "Run k6 load tests up to 10k concurrent requests and document results.",
                        TaskItemStatus.Assigned,
                        TaskPriority.Urgent,
                        proj2,
                        DateTime.UtcNow.AddDays(18),
                        new List<ApplicationUser?> { devMarco },
                        null
                    ),
                    (
                        "EU GDPR compliance audit",
                        "Full review of data processing flows against GDPR Article 30 requirements.",
                        TaskItemStatus.Assigned,
                        TaskPriority.High,
                        proj5,
                        DateTime.UtcNow.AddDays(30),
                        new List<ApplicationUser?> { devDavid },
                        null
                    ),
                    (
                        "Customer portal SSO integration",
                        "SAML 2.0 SSO with Apex's existing identity provider.",
                        TaskItemStatus.Assigned,
                        TaskPriority.Urgent,
                        proj1,
                        DateTime.UtcNow.AddDays(20),
                        new List<ApplicationUser?> { devJames, devPriya },
                        new List<(string, bool)>
                        {
                            ("Configure SAML metadata endpoints", true),
                            ("Handle assertion consumer service", false),
                            ("Test attribute mapping with IdP", false)
                        }
                    ),
                    (
                        "Set up CI/CD pipeline",
                        "GitHub Actions pipeline with staging and production deployment gates.",
                        TaskItemStatus.Completed,
                        TaskPriority.High,
                        proj2,
                        DateTime.UtcNow.AddDays(-20),
                        new List<ApplicationUser?> { devMarco },
                        null
                    )
                };

                foreach (var def in taskDefs)
                {
                    if (def.Project == null) continue;

                    var existingTask = await context.TaskItems
                        .Include(t => t.Assignees)
                        .Include(t => t.SubTasks)
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
                                .ToList(),
                            SubTasks = def.SubTasks?
                                .Select(st => new SubTask { Title = st.Title, IsCompleted = st.IsCompleted })
                                .ToList() ?? new List<SubTask>()
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

                        if (def.SubTasks != null && !existingTask.SubTasks.Any())
                        {
                            foreach (var st in def.SubTasks)
                            {
                                existingTask.SubTasks.Add(new SubTask { Title = st.Title, IsCompleted = st.IsCompleted });
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

            // Seed Teams
            if (!await context.Teams.AnyAsync() && adminUser != null && devJames != null)
            {
                var team1 = new Team
                {
                    Name = "Core Platform Team",
                    Description = "Responsible for backend infrastructure and core services.",
                    CreatedById = adminUser.Id,
                    Members = new List<TeamMember>
                    {
                        new TeamMember { UserId = devJames.Id },
                        new TeamMember { UserId = devPriya?.Id ?? devJames.Id },
                        new TeamMember { UserId = devMarco?.Id ?? devJames.Id }
                    }
                };

                var team2 = new Team
                {
                    Name = "Frontend Guild",
                    Description = "Owns user-facing interfaces.",
                    CreatedById = adminUser.Id,
                    Members = new List<TeamMember>
                    {
                        new TeamMember { UserId = devJames.Id },
                        new TeamMember { UserId = devLucas?.Id ?? devJames.Id },
                        new TeamMember { UserId = devDavid?.Id ?? devJames.Id }
                    }
                };

                await context.Teams.AddRangeAsync(team1, team2);
                await context.SaveChangesAsync();
            }
        }
    }
}
