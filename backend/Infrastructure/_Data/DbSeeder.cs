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
            // Seed Roles
            string[] roles = new[] { "Admin", "Developer", "DepartmentUser" };
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
                    (new ApplicationUser { FullName = "Aisha Nwosu", Email = "aisha.nwosu@herocrm.com", UserName = "aisha.nwosu@herocrm.com", ProfileImage = "AN", IsActive = true }, "DepartmentUser", "Password123!"),
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
                    new Project { Name = "Quantum Analytics Data Pipeline", Description = "ETL pipeline for analytics ingestion.", Status = ProjectStatus.Submitted, Priority = ProjectPriority.Medium, DueDate = DateTime.UtcNow.AddDays(60), OwnerId = 0, CustomerId = custQuantum?.Id, RequestingDepartment = "Data Science", RequestedBy = "Aisha Nwosu", BusinessJustification = "Reduce data latency by 80%" },
                    new Project { Name = "SkyBridge Fleet Tracker", Description = "GPS-integrated fleet management.", Status = ProjectStatus.Submitted, Priority = ProjectPriority.High, DueDate = DateTime.UtcNow.AddDays(40), OwnerId = 0, CustomerId = custSky?.Id, RequestingDepartment = "Operations", RequestedBy = "Aisha Nwosu", BusinessJustification = "Cut fuel costs by 20%" },
                    new Project { Name = "Internal Knowledge Base", Description = "Wiki-style internal knowledge base.", Status = ProjectStatus.Finished, Priority = ProjectPriority.Low, StartDate = DateTime.UtcNow.AddDays(-150), DueDate = DateTime.UtcNow.AddDays(-30), OwnerId = devMarco?.Id ?? devJames.Id, CustomerId = custApex?.Id, RequestingDepartment = "IT" }
                };
                await context.Projects.AddRangeAsync(projects);
                await context.SaveChangesAsync();
            }

            // Seed Tasks
            if (!await context.TaskItems.AnyAsync() && adminUser != null)
            {
                var proj1 = await context.Projects.FirstOrDefaultAsync(p => p.Name == "Apex CRM Portal Redesign");
                var proj2 = await context.Projects.FirstOrDefaultAsync(p => p.Name == "NovaTech API Gateway");
                var proj3 = await context.Projects.FirstOrDefaultAsync(p => p.Name == "HR Onboarding Automation");

                if (proj1 != null && proj2 != null)
                {
                    var task1 = new TaskItem
                    {
                        Title = "Design new dashboard wireframes",
                        Description = "Create high-fidelity wireframes.",
                        Status = TaskItemStatus.Completed,
                        Priority = TaskPriority.High,
                        ProjectId = proj1.Id,
                        CreatedById = adminUser.Id,
                        DueDate = DateTime.UtcNow.AddDays(-10),
                        Assignees = devJames != null ? new List<TaskAssignee> { new TaskAssignee { UserId = devJames.Id } } : new List<TaskAssignee>()
                    };

                    var task2 = new TaskItem
                    {
                        Title = "Implement authentication middleware",
                        Description = "JWT validation logic.",
                        Status = TaskItemStatus.Completed,
                        Priority = TaskPriority.Urgent,
                        ProjectId = proj2.Id,
                        CreatedById = adminUser.Id,
                        DueDate = DateTime.UtcNow.AddDays(-15),
                        Assignees = devPriya != null ? new List<TaskAssignee> { new TaskAssignee { UserId = devPriya.Id } } : new List<TaskAssignee>()
                    };

                    var task3 = new TaskItem
                    {
                        Title = "Responsive mobile layout",
                        Description = "Ensure mobile responsive design.",
                        Status = TaskItemStatus.InProgress,
                        Priority = TaskPriority.Medium,
                        ProjectId = proj1.Id,
                        CreatedById = adminUser.Id,
                        DueDate = DateTime.UtcNow.AddDays(10),
                        Assignees = devJames != null ? new List<TaskAssignee> { new TaskAssignee { UserId = devJames.Id } } : new List<TaskAssignee>(),
                        SubTasks = new List<SubTask>
                        {
                            new SubTask { Title = "Audit current breakpoint behavior", IsCompleted = true },
                            new SubTask { Title = "Implement responsive nav drawer", IsCompleted = true },
                            new SubTask { Title = "Fix table overflow on mobile", IsCompleted = false }
                        }
                    };

                    await context.TaskItems.AddRangeAsync(task1, task2, task3);
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
