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
        public static async Task SeedAsync(
            ApplicationDbContext context,
            UserManager<ApplicationUser> userManager,
            RoleManager<ApplicationRole> roleManager)
        {
            // 1. Seed Roles
            string[] roles = new[] { "Admin", "Developer" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new ApplicationRole { Name = role });
                }
            }

            // 2. Seed Users
            var usersToSeed = new List<(ApplicationUser User, string Role, string Password)>
            {
                (new ApplicationUser { FullName = "Sarah Chen", Email = "sarah.chen@herocrm.com", UserName = "sarah.chen@herocrm.com", ProfileImage = "SC", IsActive = true }, "Admin", "Password123!"),
                (new ApplicationUser { FullName = "James Okafor", Email = "james.okafor@herocrm.com", UserName = "james.okafor@herocrm.com", ProfileImage = "JO", IsActive = true }, "Developer", "Password123!"),
                (new ApplicationUser { FullName = "Priya Mehta", Email = "priya.mehta@herocrm.com", UserName = "priya.mehta@herocrm.com", ProfileImage = "PM", IsActive = true }, "Developer", "Password123!"),
                (new ApplicationUser { FullName = "Lucas Rivera", Email = "lucas.rivera@herocrm.com", UserName = "lucas.rivera@herocrm.com", ProfileImage = "LR", IsActive = true }, "Developer", "Password123!"),
                (new ApplicationUser { FullName = "David Park", Email = "david.park@herocrm.com", UserName = "david.park@herocrm.com", ProfileImage = "DP", IsActive = true }, "Developer", "Password123!"),
                (new ApplicationUser { FullName = "Aisha Nwosu", Email = "aisha.nwosu@herocrm.com", UserName = "aisha.nwosu@herocrm.com", ProfileImage = "AN", IsActive = true }, "Developer", "Password123!"),
                (new ApplicationUser { FullName = "Marco Ferretti", Email = "marco.ferretti@herocrm.com", UserName = "marco.ferretti@herocrm.com", ProfileImage = "MF", IsActive = true }, "Developer", "Password123!"),
                (new ApplicationUser { FullName = "Elena Volkov", Email = "elena.volkov@herocrm.com", UserName = "elena.volkov@herocrm.com", ProfileImage = "EV", IsActive = false }, "Developer", "Password123!"),
            };

            foreach (var (user, role, password) in usersToSeed)
            {
                var existingUser = await userManager.FindByEmailAsync(user.Email!);
                if (existingUser == null)
                {
                    var result = await userManager.CreateAsync(user, password);
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, role);
                    }
                }
            }

            // Fetch team references
            var adminSarah = await userManager.FindByEmailAsync("sarah.chen@herocrm.com");
            var devJames = await userManager.FindByEmailAsync("james.okafor@herocrm.com");
            var devPriya = await userManager.FindByEmailAsync("priya.mehta@herocrm.com");
            var devLucas = await userManager.FindByEmailAsync("lucas.rivera@herocrm.com");
            var devDavid = await userManager.FindByEmailAsync("david.park@herocrm.com");
            var devAisha = await userManager.FindByEmailAsync("aisha.nwosu@herocrm.com");
            var devMarco = await userManager.FindByEmailAsync("marco.ferretti@herocrm.com");

            if (adminSarah == null || devJames == null || devPriya == null) return;

            // 3. Clear existing seed data to ensure fresh, modern state
            try
            {
                var existingComments = await context.Comments.ToListAsync();
                if (existingComments.Any()) context.Comments.RemoveRange(existingComments);

                var existingNotifications = await context.Notifications.ToListAsync();
                if (existingNotifications.Any()) context.Notifications.RemoveRange(existingNotifications);

                var existingTaskAssignees = await context.TaskAssignees.ToListAsync();
                if (existingTaskAssignees.Any()) context.TaskAssignees.RemoveRange(existingTaskAssignees);

                var existingTasks = await context.TaskItems.ToListAsync();
                if (existingTasks.Any()) context.TaskItems.RemoveRange(existingTasks);

                var existingProjectMembers = await context.ProjectMembers.ToListAsync();
                if (existingProjectMembers.Any()) context.ProjectMembers.RemoveRange(existingProjectMembers);

                var existingProjects = await context.Projects.ToListAsync();
                if (existingProjects.Any()) context.Projects.RemoveRange(existingProjects);

                await context.SaveChangesAsync();
            }
            catch
            {
                // Fallback if table structures are fresh
            }

            // 4. Seed Projects (strictly: InProgress = 1, Finished = 2, Cancelled = 3)
            var projApex = new Project
            {
                Name = "Apex CRM Portal Redesign",
                Description = "Full-stack redesign of client portal UI and backend APIs with modern UX standards and role-based views.",
                Status = ProjectStatus.InProgress,
                Priority = ProjectPriority.High,
                StartDate = DateTime.UtcNow.AddDays(-30),
                DueDate = DateTime.UtcNow.AddDays(25),
                OwnerId = devJames.Id,
                RequestingDepartment = "IT",
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            };

            var projNova = new Project
            {
                Name = "NovaTech Microservices API Gateway",
                Description = "Unified reverse proxy, JWT authentication middleware, and rate-limiting gateway for internal microservices.",
                Status = ProjectStatus.InProgress,
                Priority = ProjectPriority.Urgent,
                StartDate = DateTime.UtcNow.AddDays(-40),
                DueDate = DateTime.UtcNow.AddDays(15),
                OwnerId = devPriya.Id,
                RequestingDepartment = "Engineering",
                CreatedAt = DateTime.UtcNow.AddDays(-40)
            };

            var projHr = new Project
            {
                Name = "HR Onboarding & Compliance Automation",
                Description = "End-to-end automated onboarding platform for document collection, digital signing, and compliance reporting.",
                Status = ProjectStatus.InProgress,
                Priority = ProjectPriority.Medium,
                StartDate = DateTime.UtcNow.AddDays(-60),
                DueDate = DateTime.UtcNow.AddDays(-5), // Overdue project!
                OwnerId = devLucas!.Id,
                RequestingDepartment = "Human Resources",
                MissedDeadlineReason = "Pending external compliance audit and sandbox API credentials from third-party background check provider.",
                ReasonCategory = "External Dependencies",
                CreatedAt = DateTime.UtcNow.AddDays(-60)
            };

            var projMeridian = new Project
            {
                Name = "Meridian Financial Compliance Platform",
                Description = "Regulatory reporting dashboard and immutable transaction logging complying with SOX and GDPR Article 30 standards.",
                Status = ProjectStatus.Finished,
                Priority = ProjectPriority.High,
                StartDate = DateTime.UtcNow.AddDays(-90),
                DueDate = DateTime.UtcNow.AddDays(-15),
                OwnerId = devJames.Id,
                RequestingDepartment = "Legal",
                CreatedAt = DateTime.UtcNow.AddDays(-90)
            };

            var projSky = new Project
            {
                Name = "SkyBridge Enterprise Fleet Logistics",
                Description = "Real-time GPS telematics and delivery route optimizer (cancelled due to organizational strategic priority shift).",
                Status = ProjectStatus.Cancelled,
                Priority = ProjectPriority.High,
                StartDate = DateTime.UtcNow.AddDays(-20),
                DueDate = DateTime.UtcNow.AddDays(40),
                OwnerId = devLucas!.Id,
                RequestingDepartment = "Operations",
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            };

            var projEuro = new Project
            {
                Name = "EuroRetail E-Commerce Integration",
                Description = "Multi-currency checkout, VAT compliance, and localized product catalog integration for European market expansion.",
                Status = ProjectStatus.InProgress,
                Priority = ProjectPriority.High,
                StartDate = DateTime.UtcNow.AddDays(-10),
                DueDate = DateTime.UtcNow.AddDays(45),
                OwnerId = devDavid!.Id,
                RequestingDepartment = "Sales",
                CreatedAt = DateTime.UtcNow.AddDays(-10)
            };

            var projWiki = new Project
            {
                Name = "Enterprise Knowledge Base & Documentation Hub",
                Description = "Internal markdown-based knowledge base with full-text search, article versioning, and role-based permissions.",
                Status = ProjectStatus.Finished,
                Priority = ProjectPriority.Low,
                StartDate = DateTime.UtcNow.AddDays(-120),
                DueDate = DateTime.UtcNow.AddDays(-30),
                OwnerId = devMarco!.Id,
                RequestingDepartment = "IT",
                CreatedAt = DateTime.UtcNow.AddDays(-120)
            };

            var projectsList = new List<Project> { projApex, projNova, projHr, projMeridian, projSky, projEuro, projWiki };
            await context.Projects.AddRangeAsync(projectsList);
            await context.SaveChangesAsync();

            // 5. Seed Project Members
            var memberMappings = new List<(Project Proj, List<ApplicationUser?> Devs)>
            {
                (projApex, new List<ApplicationUser?> { devJames, devPriya, devDavid }),
                (projNova, new List<ApplicationUser?> { devPriya, devMarco, devDavid }),
                (projHr, new List<ApplicationUser?> { devLucas, devJames, devAisha }),
                (projMeridian, new List<ApplicationUser?> { devJames, devPriya }),
                (projSky, new List<ApplicationUser?> { devLucas, devMarco }),
                (projEuro, new List<ApplicationUser?> { devDavid, devAisha }),
                (projWiki, new List<ApplicationUser?> { devMarco, devJames })
            };

            foreach (var (proj, devs) in memberMappings)
            {
                foreach (var dev in devs)
                {
                    if (dev == null) continue;
                    context.ProjectMembers.Add(new ProjectMember
                    {
                        ProjectId = proj.Id,
                        UserId = dev.Id,
                        JoinedAt = DateTime.UtcNow.AddDays(-25)
                    });
                }
            }
            await context.SaveChangesAsync();

            // 6. Seed Tasks (strictly: Assigned = 0, Review = 1, Completed = 2, Cancelled = 3)
            var tasksToSeed = new List<TaskItem>
            {
                // Apex CRM Portal Redesign (InProgress)
                new TaskItem
                {
                    Title = "Design responsive layout & navigation",
                    Description = "Create mobile-first dashboard wireframes and implement responsive sidebar navigation.",
                    Status = TaskItemStatus.Completed,
                    Priority = TaskPriority.High,
                    ProjectId = projApex.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(-5),
                    CompletedAt = DateTime.UtcNow.AddDays(-6),
                    CreatedAt = DateTime.UtcNow.AddDays(-28),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devJames.Id, AssignedAt = DateTime.UtcNow.AddDays(-28) } }
                },
                new TaskItem
                {
                    Title = "Implement OAuth2 authentication & JWT refresh",
                    Description = "Secure JWT validation, cookie storage, and automated token refresh rotation.",
                    Status = TaskItemStatus.Completed,
                    Priority = TaskPriority.Urgent,
                    ProjectId = projApex.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(-2),
                    CompletedAt = DateTime.UtcNow.AddDays(-2),
                    CreatedAt = DateTime.UtcNow.AddDays(-25),
                    Assignees = new List<TaskAssignee>
                    {
                        new TaskAssignee { UserId = devJames.Id, AssignedAt = DateTime.UtcNow.AddDays(-25) },
                        new TaskAssignee { UserId = devPriya.Id, AssignedAt = DateTime.UtcNow.AddDays(-25) }
                    }
                },
                new TaskItem
                {
                    Title = "Build customer CRM analytics widgets",
                    Description = "Implement executive KPI summary cards, deal conversion charts, and activity heatmaps.",
                    Status = TaskItemStatus.Review, // In Review!
                    Priority = TaskPriority.High,
                    ProjectId = projApex.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(5),
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devDavid!.Id, AssignedAt = DateTime.UtcNow.AddDays(-15) } }
                },
                new TaskItem
                {
                    Title = "Cross-browser QA and accessibility audit",
                    Description = "Run WCAG 2.1 AA accessibility audit and verify compatibility on Safari, Chrome, and Firefox.",
                    Status = TaskItemStatus.Assigned,
                    Priority = TaskPriority.Medium,
                    ProjectId = projApex.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(15),
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devJames.Id, AssignedAt = DateTime.UtcNow.AddDays(-10) } }
                },

                // NovaTech API Gateway (InProgress)
                new TaskItem
                {
                    Title = "Configure Redis distributed cache for rate limiting",
                    Description = "Implement token-bucket algorithm in Redis to throttle excessive API requests per client IP.",
                    Status = TaskItemStatus.Completed,
                    Priority = TaskPriority.High,
                    ProjectId = projNova.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(-10),
                    CompletedAt = DateTime.UtcNow.AddDays(-10),
                    CreatedAt = DateTime.UtcNow.AddDays(-35),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devPriya.Id, AssignedAt = DateTime.UtcNow.AddDays(-35) } }
                },
                new TaskItem
                {
                    Title = "Deploy k6 load testing suite for API gateway",
                    Description = "Execute automated benchmark tests under 10,000 requests/second load and analyze latency p99.",
                    Status = TaskItemStatus.Review, // In Review!
                    Priority = TaskPriority.Urgent,
                    ProjectId = projNova.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(8),
                    CreatedAt = DateTime.UtcNow.AddDays(-12),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devMarco!.Id, AssignedAt = DateTime.UtcNow.AddDays(-12) } }
                },
                new TaskItem
                {
                    Title = "Implement centralized request logging & correlation IDs",
                    Description = "Add W3C Trace Context propagation and structured Serilog output for microservice calls.",
                    Status = TaskItemStatus.Assigned,
                    Priority = TaskPriority.High,
                    ProjectId = projNova.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(12),
                    CreatedAt = DateTime.UtcNow.AddDays(-8),
                    Assignees = new List<TaskAssignee>
                    {
                        new TaskAssignee { UserId = devDavid!.Id, AssignedAt = DateTime.UtcNow.AddDays(-8) },
                        new TaskAssignee { UserId = devPriya.Id, AssignedAt = DateTime.UtcNow.AddDays(-8) }
                    }
                },

                // HR Onboarding & Compliance Automation (InProgress & Overdue)
                new TaskItem
                {
                    Title = "Digital signature workflow integration",
                    Description = "Integrate DocuSign REST API for employee contract and handbook electronic signatures.",
                    Status = TaskItemStatus.Review, // In Review!
                    Priority = TaskPriority.High,
                    ProjectId = projHr.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(-1),
                    CreatedAt = DateTime.UtcNow.AddDays(-40),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devLucas!.Id, AssignedAt = DateTime.UtcNow.AddDays(-40) } }
                },
                new TaskItem
                {
                    Title = "Employee identity verification API integration",
                    Description = "Automated government ID verification and background check webhook receiver.",
                    Status = TaskItemStatus.Assigned,
                    Priority = TaskPriority.Urgent,
                    ProjectId = projHr.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(-3), // Overdue Task!
                    MissedDeadlineReason = "Waiting for vendor sandbox verification keys and network security clearance.",
                    ReasonCategory = "External Dependencies",
                    CreatedAt = DateTime.UtcNow.AddDays(-30),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devLucas!.Id, AssignedAt = DateTime.UtcNow.AddDays(-30) } }
                },
                new TaskItem
                {
                    Title = "Automated onboarding welcome email sequence",
                    Description = "Set up scheduled email triggers with company orientation documents and IT credentials.",
                    Status = TaskItemStatus.Assigned,
                    Priority = TaskPriority.Medium,
                    ProjectId = projHr.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(5),
                    CreatedAt = DateTime.UtcNow.AddDays(-15),
                    Assignees = new List<TaskAssignee>
                    {
                        new TaskAssignee { UserId = devAisha!.Id, AssignedAt = DateTime.UtcNow.AddDays(-15) },
                        new TaskAssignee { UserId = devLucas!.Id, AssignedAt = DateTime.UtcNow.AddDays(-15) }
                    }
                },

                // Meridian Financial Compliance Platform (Finished - All Tasks Completed)
                new TaskItem
                {
                    Title = "SOX compliance audit report generator",
                    Description = "Generate PDF and CSV reports tracking authorization events and database mutation logs.",
                    Status = TaskItemStatus.Completed,
                    Priority = TaskPriority.High,
                    ProjectId = projMeridian.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(-25),
                    CompletedAt = DateTime.UtcNow.AddDays(-26),
                    CreatedAt = DateTime.UtcNow.AddDays(-80),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devJames.Id, AssignedAt = DateTime.UtcNow.AddDays(-80) } }
                },
                new TaskItem
                {
                    Title = "Automated transaction hashing & tamper verification",
                    Description = "Cryptographic checksum computation on transaction records to prevent record tampering.",
                    Status = TaskItemStatus.Completed,
                    Priority = TaskPriority.Urgent,
                    ProjectId = projMeridian.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(-20),
                    CompletedAt = DateTime.UtcNow.AddDays(-20),
                    CreatedAt = DateTime.UtcNow.AddDays(-75),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devPriya.Id, AssignedAt = DateTime.UtcNow.AddDays(-75) } }
                },

                // SkyBridge Enterprise Fleet Logistics (Cancelled)
                new TaskItem
                {
                    Title = "GPS telemetry WebSocket ingestion server",
                    Description = "High-throughput WebSocket service to stream real-time vehicle coordinates into cache.",
                    Status = TaskItemStatus.Cancelled,
                    Priority = TaskPriority.High,
                    ProjectId = projSky.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(20),
                    CreatedAt = DateTime.UtcNow.AddDays(-18),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devLucas!.Id, AssignedAt = DateTime.UtcNow.AddDays(-18) } }
                },

                // EuroRetail E-Commerce Integration (InProgress)
                new TaskItem
                {
                    Title = "Stripe multi-currency checkout integration",
                    Description = "Handle EUR, GBP, and CHF payment processing with automated localized receipt delivery.",
                    Status = TaskItemStatus.Assigned,
                    Priority = TaskPriority.High,
                    ProjectId = projEuro.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(20),
                    CreatedAt = DateTime.UtcNow.AddDays(-9),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devDavid!.Id, AssignedAt = DateTime.UtcNow.AddDays(-9) } }
                },
                new TaskItem
                {
                    Title = "Localized EU VAT tax calculation service",
                    Description = "Integrate VIES database validation for cross-border European B2B and B2C sales taxation.",
                    Status = TaskItemStatus.Assigned,
                    Priority = TaskPriority.Medium,
                    ProjectId = projEuro.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(25),
                    CreatedAt = DateTime.UtcNow.AddDays(-7),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devAisha!.Id, AssignedAt = DateTime.UtcNow.AddDays(-7) } }
                },

                // Enterprise Knowledge Base & Documentation Hub (Finished - All Tasks Completed)
                new TaskItem
                {
                    Title = "Markdown editor and live preview renderer",
                    Description = "Rich text editor with syntax highlighting, live KaTeX math formula rendering, and asset insertion.",
                    Status = TaskItemStatus.Completed,
                    Priority = TaskPriority.Medium,
                    ProjectId = projWiki.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(-40),
                    CompletedAt = DateTime.UtcNow.AddDays(-42),
                    CreatedAt = DateTime.UtcNow.AddDays(-110),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devMarco!.Id, AssignedAt = DateTime.UtcNow.AddDays(-110) } }
                },
                new TaskItem
                {
                    Title = "Elasticsearch full-text article indexing",
                    Description = "Configured autocomplete, fuzzy search, and permission-aware search filters across articles.",
                    Status = TaskItemStatus.Completed,
                    Priority = TaskPriority.High,
                    ProjectId = projWiki.Id,
                    CreatedById = adminSarah.Id,
                    DueDate = DateTime.UtcNow.AddDays(-35),
                    CompletedAt = DateTime.UtcNow.AddDays(-35),
                    CreatedAt = DateTime.UtcNow.AddDays(-105),
                    Assignees = new List<TaskAssignee> { new TaskAssignee { UserId = devJames.Id, AssignedAt = DateTime.UtcNow.AddDays(-105) } }
                }
            };

            await context.TaskItems.AddRangeAsync(tasksToSeed);
            await context.SaveChangesAsync();

            // 7. Seed Comments
            var taskWidgets = await context.TaskItems.FirstOrDefaultAsync(t => t.Title == "Build customer CRM analytics widgets");
            var taskVerify = await context.TaskItems.FirstOrDefaultAsync(t => t.Title == "Employee identity verification API integration");
            var taskStripe = await context.TaskItems.FirstOrDefaultAsync(t => t.Title == "Stripe multi-currency checkout integration");

            var commentsToSeed = new List<Comment>();
            if (taskWidgets != null && devDavid != null)
            {
                commentsToSeed.Add(new Comment
                {
                    TaskItemId = taskWidgets.Id,
                    UserId = devDavid.Id,
                    Content = "Submitted the initial draft of the KPI metrics cards and revenue breakdown widget for review.",
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                });
                commentsToSeed.Add(new Comment
                {
                    TaskItemId = taskWidgets.Id,
                    UserId = adminSarah.Id,
                    Content = "Looking great David! Please make sure the currency formatting respects locale before final approval.",
                    CreatedAt = DateTime.UtcNow.AddHours(-18)
                });
            }

            if (taskVerify != null && devLucas != null)
            {
                commentsToSeed.Add(new Comment
                {
                    TaskItemId = taskVerify.Id,
                    UserId = devLucas.Id,
                    Content = "Spoke with vendor support this morning; sandbox verification keys should be issued by end of day.",
                    CreatedAt = DateTime.UtcNow.AddHours(-6)
                });
            }

            if (taskStripe != null && devDavid != null)
            {
                commentsToSeed.Add(new Comment
                {
                    TaskItemId = taskStripe.Id,
                    UserId = devDavid.Id,
                    Content = "Stripe sandbox webhook integration passed all unit tests for EUR and GBP.",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                });
            }

            if (commentsToSeed.Any())
            {
                await context.Comments.AddRangeAsync(commentsToSeed);
                await context.SaveChangesAsync();
            }

            // 8. Seed Notifications (clean messages with "Developer", no "Lead Developer")
            var notificationsToSeed = new List<Notification>
            {
                new Notification
                {
                    UserId = adminSarah.Id,
                    Title = "Task Submitted for Review",
                    Message = "Task 'Build customer CRM analytics widgets' has been submitted for review by David Park.",
                    Type = NotificationType.General,
                    ProjectId = projApex.Id,
                    TaskId = taskWidgets?.Id,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddHours(-18)
                },
                new Notification
                {
                    UserId = devJames.Id,
                    Title = "New Project Assigned",
                    Message = $"You have been assigned as Developer for the project '{projApex.Name}'.",
                    Type = NotificationType.ProjectAssigned,
                    ProjectId = projApex.Id,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-45)
                },
                new Notification
                {
                    UserId = devPriya.Id,
                    Title = "New Project Assigned",
                    Message = $"You have been assigned as Developer for the project '{projNova.Name}'.",
                    Type = NotificationType.ProjectAssigned,
                    ProjectId = projNova.Id,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-40)
                },
                new Notification
                {
                    UserId = devLucas!.Id,
                    Title = "Deadline Missed / Overdue",
                    Message = "Overdue Alert: 'Employee identity verification API integration' missed its deadline. Please submit your reason.",
                    Type = NotificationType.DeadlineMissed,
                    ProjectId = projHr.Id,
                    TaskId = taskVerify?.Id,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow.AddDays(-3)
                }
            };

            await context.Notifications.AddRangeAsync(notificationsToSeed);
            await context.SaveChangesAsync();
        }
    }
}
