using CRM.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class SearchController : ControllerBase
    {
        private const string DepartmentType = "Department";
        private readonly ApplicationDbContext _context;

        public SearchController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Search([FromQuery] string q)
        {
            if (string.IsNullOrWhiteSpace(q))
            {
                return BadRequest(new { message = "Search term is required." });
            }

            var term = q.Trim();

            var departments = await _context.Customers
                .AsNoTracking()
                .Where(d =>
                    d.Type == DepartmentType &&
                    (d.Name.Contains(term) ||
                     (d.Description != null && d.Description.Contains(term)) ||
                     (d.Email != null && d.Email.Contains(term)) ||
                     (d.Phone != null && d.Phone.Contains(term)) ||
                     d.Contacts.Any(person =>
                        person.Name.Contains(term) ||
                        (person.Email != null && person.Email.Contains(term)))))
                .OrderBy(d => d.Name)
                .Take(10)
                .Select(d => new
                {
                    id = d.Id,
                    name = d.Name,
                    status = d.Status,
                    ownerName = d.Owner != null ? d.Owner.FullName : null,
                    peopleCount = d.Contacts.Count
                })
                .ToListAsync();

            var people = await _context.Contacts
                .AsNoTracking()
                .Where(person =>
                    person.Organization.Type == DepartmentType &&
                    (person.Name.Contains(term) ||
                     (person.Email != null && person.Email.Contains(term)) ||
                     (person.Phone != null && person.Phone.Contains(term)) ||
                     (person.JobTitle != null && person.JobTitle.Contains(term)) ||
                     person.Organization.Name.Contains(term)))
                .OrderBy(person => person.Name)
                .Take(10)
                .Select(person => new
                {
                    id = person.Id,
                    name = person.Name,
                    jobTitle = person.JobTitle,
                    email = person.Email,
                    departmentId = person.OrganizationId,
                    departmentName = person.Organization.Name
                })
                .ToListAsync();

            var projects = await _context.Projects
                .AsNoTracking()
                .Where(project =>
                    project.Name.Contains(term) ||
                    (project.Description != null && project.Description.Contains(term)) ||
                    (project.Customer != null && project.Customer.Name.Contains(term)))
                .OrderBy(project => project.Name)
                .Take(10)
                .Select(project => new
                {
                    id = project.Id,
                    name = project.Name,
                    status = project.Status,
                    departmentName = project.Customer != null ? project.Customer.Name : null
                })
                .ToListAsync();

            var tasks = await _context.TaskItems
                .AsNoTracking()
                .Where(task =>
                    task.Title.Contains(term) ||
                    (task.Description != null && task.Description.Contains(term)) ||
                    (task.Project != null && task.Project.Name.Contains(term)))
                .OrderBy(task => task.Title)
                .Take(10)
                .Select(task => new
                {
                    id = task.Id,
                    title = task.Title,
                    status = task.Status,
                    priority = task.Priority,
                    projectId = task.ProjectId,
                    projectName = task.Project != null ? task.Project.Name : null
                })
                .ToListAsync();

            var followUps = await _context.FollowUps
                .AsNoTracking()
                .Where(followUp =>
                    followUp.Title.Contains(term) ||
                    (followUp.Description != null && followUp.Description.Contains(term)) ||
                    (followUp.Outcome != null && followUp.Outcome.Contains(term)) ||
                    (followUp.Contact != null && followUp.Contact.Name.Contains(term)) ||
                    (followUp.Department != null && followUp.Department.Name.Contains(term)) ||
                    (followUp.Project != null && followUp.Project.Name.Contains(term)))
                .OrderBy(followUp => followUp.Status == "Open" ? 0 : 1)
                .ThenBy(followUp => followUp.DueAt)
                .Take(10)
                .Select(followUp => new
                {
                    id = followUp.Id,
                    title = followUp.Title,
                    type = followUp.Type,
                    status = followUp.Status,
                    dueAt = followUp.DueAt,
                    contactName = followUp.Contact != null ? followUp.Contact.Name : null,
                    departmentName = followUp.Department != null ? followUp.Department.Name : null,
                    projectName = followUp.Project != null ? followUp.Project.Name : null
                })
                .ToListAsync();

            return Ok(new
            {
                query = term,
                departments,
                people,
                projects,
                tasks,
                followUps
            });
        }
    }
}
