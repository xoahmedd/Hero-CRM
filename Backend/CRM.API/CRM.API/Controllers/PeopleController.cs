using CRM.API.Data;
using CRM.API.DTOs.People;
using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/people")]
    [Authorize]
    public class PeopleController : ControllerBase
    {
        private const string DepartmentType = "Department";
        private const string PersonTagScope = "Person";
        private const string PersonEntityType = "Person";

        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;

        public PeopleController(ApplicationDbContext context, ActivityLogger activityLogger)
        {
            _context = context;
            _activityLogger = activityLogger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PersonResponse>>> GetPeople(
            [FromQuery] int? departmentId = null,
            [FromQuery] string? search = null)
        {
            var query = _context.Contacts
                .AsNoTracking()
                .Where(person => person.Organization.Type == DepartmentType);

            if (departmentId.HasValue)
            {
                query = query.Where(person => person.OrganizationId == departmentId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim();
                query = query.Where(person =>
                    person.Name.Contains(term) ||
                    (person.JobTitle != null && person.JobTitle.Contains(term)) ||
                    (person.Email != null && person.Email.Contains(term)) ||
                    (person.Phone != null && person.Phone.Contains(term)) ||
                    person.Organization.Name.Contains(term));
            }

            var people = await query
                .OrderByDescending(person => person.IsPrimary)
                .ThenBy(person => person.Name)
                .Select(person => new PersonResponse
                {
                    Id = person.Id,
                    DepartmentId = person.OrganizationId,
                    DepartmentName = person.Organization.Name,
                    Name = person.Name,
                    JobTitle = person.JobTitle,
                    Email = person.Email,
                    Phone = person.Phone,
                    IsPrimary = person.IsPrimary,
                    CreatedAt = person.CreatedAt,
                    UpdatedAt = person.UpdatedAt
                })
                .ToListAsync();

            return Ok(people);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<PersonDetailsResponse>> GetPerson(int id)
        {
            var person = await _context.Contacts
                .AsNoTracking()
                .Where(person => person.Id == id && person.Organization.Type == DepartmentType)
                .Select(person => new PersonDetailsResponse
                {
                    Id = person.Id,
                    DepartmentId = person.OrganizationId,
                    DepartmentName = person.Organization.Name,
                    Name = person.Name,
                    JobTitle = person.JobTitle,
                    Email = person.Email,
                    Phone = person.Phone,
                    IsPrimary = person.IsPrimary,
                    CreatedAt = person.CreatedAt,
                    UpdatedAt = person.UpdatedAt,
                    NoteCount = person.Notes.Count(),
                    TagCount = person.TagAssignments.Count(),
                    RelatedProjectCount = person.Organization.Projects.Count()
                })
                .FirstOrDefaultAsync();

            return person == null
                ? NotFound(new { message = "Person not found." })
                : Ok(person);
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PersonResponse>> CreatePerson(CreatePersonRequest request)
        {
            var department = await GetDepartmentAsync(request.DepartmentId);
            if (department == null)
            {
                return BadRequest(new { message = "Department not found." });
            }

            var name = request.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "Name is required." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var now = DateTime.UtcNow;
            if (request.IsPrimary)
            {
                await ClearOtherPrimaryContactsAsync(request.DepartmentId, null, now);
            }

            var person = new Contact
            {
                OrganizationId = request.DepartmentId,
                Name = name,
                JobTitle = NormalizeOptional(request.JobTitle),
                Email = NormalizeEmail(request.Email),
                Phone = NormalizeOptional(request.Phone),
                IsPrimary = request.IsPrimary,
                CreatedAt = now
            };

            _context.Contacts.Add(person);
            await _context.SaveChangesAsync();

            _activityLogger.Add(userId.Value, PersonEntityType, person.Id, "Person created", $"Added {person.Name} to {department.Name}.");
            _activityLogger.Add(userId.Value, "Department", department.Id, "Person added", $"Added {person.Name}.");
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPerson), new { id = person.Id }, ToResponse(person, department.Name));
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PersonResponse>> UpdatePerson(int id, UpdatePersonRequest request)
        {
            var person = await _context.Contacts
                .Include(c => c.Organization)
                .FirstOrDefaultAsync(c => c.Id == id && c.Organization.Type == DepartmentType);

            if (person == null)
            {
                return NotFound(new { message = "Person not found." });
            }

            var department = await GetDepartmentAsync(request.DepartmentId);
            if (department == null)
            {
                return BadRequest(new { message = "Department not found." });
            }

            var name = request.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "Name is required." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var oldDepartmentId = person.OrganizationId;
            var oldDepartmentName = person.Organization.Name;
            var now = DateTime.UtcNow;

            if (request.IsPrimary)
            {
                await ClearOtherPrimaryContactsAsync(request.DepartmentId, person.Id, now);
            }

            person.OrganizationId = request.DepartmentId;
            person.Name = name;
            person.JobTitle = NormalizeOptional(request.JobTitle);
            person.Email = NormalizeEmail(request.Email);
            person.Phone = NormalizeOptional(request.Phone);
            person.IsPrimary = request.IsPrimary;
            person.UpdatedAt = now;

            _activityLogger.Add(userId.Value, PersonEntityType, person.Id, "Person updated", $"Updated {person.Name}'s CRM profile.");
            if (oldDepartmentId != request.DepartmentId)
            {
                _activityLogger.Add(userId.Value, "Department", oldDepartmentId, "Person moved", $"Moved {person.Name} to {department.Name}.");
                _activityLogger.Add(userId.Value, "Department", request.DepartmentId, "Person added", $"Moved {person.Name} from {oldDepartmentName}.");
            }

            await _context.SaveChangesAsync();
            return Ok(ToResponse(person, department.Name));
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePerson(int id)
        {
            var person = await _context.Contacts
                .Include(c => c.Organization)
                .FirstOrDefaultAsync(c => c.Id == id && c.Organization.Type == DepartmentType);

            if (person == null)
            {
                return NotFound(new { message = "Person not found." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var personName = person.Name;
            var departmentId = person.OrganizationId;
            _context.Contacts.Remove(person);
            _activityLogger.Add(userId.Value, PersonEntityType, id, "Person deleted", $"Removed {personName} from the CRM.");
            _activityLogger.Add(userId.Value, "Department", departmentId, "Person removed", $"Removed {personName}.");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Person deleted successfully." });
        }

        [HttpGet("{id:int}/notes")]
        public async Task<ActionResult<IEnumerable<PersonNoteResponse>>> GetNotes(int id)
        {
            if (!await PersonExistsAsync(id))
            {
                return NotFound(new { message = "Person not found." });
            }

            var notes = await _context.ContactNotes
                .AsNoTracking()
                .Where(n => n.ContactId == id)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new PersonNoteResponse
                {
                    Id = n.Id,
                    PersonId = n.ContactId,
                    UserId = n.UserId,
                    UserName = n.User.FullName,
                    Content = n.Content,
                    CreatedAt = n.CreatedAt,
                    UpdatedAt = n.UpdatedAt
                })
                .ToListAsync();

            return Ok(notes);
        }

        [HttpPost("{id:int}/notes")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PersonNoteResponse>> CreateNote(int id, CreatePersonNoteRequest request)
        {
            var person = await _context.Contacts
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id && c.Organization.Type == DepartmentType);
            if (person == null)
            {
                return NotFound(new { message = "Person not found." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var content = request.Content.Trim();
            if (string.IsNullOrWhiteSpace(content))
            {
                return BadRequest(new { message = "Note content is required." });
            }

            var note = new ContactNote
            {
                ContactId = id,
                UserId = userId.Value,
                Content = content,
                CreatedAt = DateTime.UtcNow
            };

            _context.ContactNotes.Add(note);
            _activityLogger.Add(userId.Value, PersonEntityType, id, "Note added", Truncate(content, 180));
            await _context.SaveChangesAsync();

            var saved = await _context.ContactNotes
                .AsNoTracking()
                .Where(n => n.Id == note.Id)
                .Select(n => new PersonNoteResponse
                {
                    Id = n.Id,
                    PersonId = n.ContactId,
                    UserId = n.UserId,
                    UserName = n.User.FullName,
                    Content = n.Content,
                    CreatedAt = n.CreatedAt,
                    UpdatedAt = n.UpdatedAt
                })
                .FirstAsync();

            return Ok(saved);
        }

        [HttpPut("{id:int}/notes/{noteId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateNote(int id, int noteId, CreatePersonNoteRequest request)
        {
            var note = await _context.ContactNotes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.ContactId == id && n.Contact.Organization.Type == DepartmentType);
            if (note == null)
            {
                return NotFound(new { message = "Note not found." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            if (!User.IsInRole("Admin") && note.UserId != userId.Value)
            {
                return Forbid();
            }

            var content = request.Content.Trim();
            if (string.IsNullOrWhiteSpace(content))
            {
                return BadRequest(new { message = "Note content is required." });
            }

            note.Content = content;
            note.UpdatedAt = DateTime.UtcNow;
            _activityLogger.Add(userId.Value, PersonEntityType, id, "Note updated", "Updated a person note.");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Note updated successfully." });
        }

        [HttpDelete("{id:int}/notes/{noteId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteNote(int id, int noteId)
        {
            var note = await _context.ContactNotes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.ContactId == id && n.Contact.Organization.Type == DepartmentType);
            if (note == null)
            {
                return NotFound(new { message = "Note not found." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            if (!User.IsInRole("Admin") && note.UserId != userId.Value)
            {
                return Forbid();
            }

            _context.ContactNotes.Remove(note);
            _activityLogger.Add(userId.Value, PersonEntityType, id, "Note removed", "Removed a person note.");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Note deleted successfully." });
        }

        [HttpGet("tags")]
        public async Task<ActionResult<IEnumerable<PersonTagResponse>>> GetTagCatalog()
        {
            var tags = await _context.OrganizationTags
                .AsNoTracking()
                .Where(t => t.Scope == PersonTagScope)
                .OrderBy(t => t.Name)
                .Select(t => new PersonTagResponse { Id = t.Id, Name = t.Name, Color = t.Color })
                .ToListAsync();
            return Ok(tags);
        }

        [HttpPost("tags")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<PersonTagResponse>> CreateTag(CreatePersonTagRequest request)
        {
            var name = request.Name.Trim();
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest(new { message = "Tag name is required." });
            }

            var exists = await _context.OrganizationTags
                .AsNoTracking()
                .AnyAsync(t => t.Scope == PersonTagScope && t.Name == name);
            if (exists)
            {
                return Conflict(new { message = "A person tag with this name already exists." });
            }

            var tag = new OrganizationTag
            {
                Name = name,
                Color = NormalizeOptional(request.Color),
                Scope = PersonTagScope,
                CreatedAt = DateTime.UtcNow
            };
            _context.OrganizationTags.Add(tag);
            await _context.SaveChangesAsync();

            return Ok(new PersonTagResponse { Id = tag.Id, Name = tag.Name, Color = tag.Color });
        }

        [HttpGet("{id:int}/tags")]
        public async Task<ActionResult<IEnumerable<PersonTagResponse>>> GetPersonTags(int id)
        {
            if (!await PersonExistsAsync(id))
            {
                return NotFound(new { message = "Person not found." });
            }

            var tags = await _context.ContactTagAssignments
                .AsNoTracking()
                .Where(a => a.ContactId == id && a.Tag.Scope == PersonTagScope)
                .OrderBy(a => a.Tag.Name)
                .Select(a => new PersonTagResponse { Id = a.TagId, Name = a.Tag.Name, Color = a.Tag.Color })
                .ToListAsync();
            return Ok(tags);
        }

        [HttpPost("{id:int}/tags/{tagId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AssignTag(int id, int tagId)
        {
            if (!await PersonExistsAsync(id))
            {
                return NotFound(new { message = "Person not found." });
            }

            var tag = await _context.OrganizationTags
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == tagId && t.Scope == PersonTagScope);
            if (tag == null)
            {
                return NotFound(new { message = "Person tag not found." });
            }

            if (await _context.ContactTagAssignments.AnyAsync(a => a.ContactId == id && a.TagId == tagId))
            {
                return Conflict(new { message = "Tag is already assigned to this person." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            _context.ContactTagAssignments.Add(new ContactTagAssignment
            {
                ContactId = id,
                TagId = tagId,
                AssignedAt = DateTime.UtcNow
            });
            _activityLogger.Add(userId.Value, PersonEntityType, id, "Tag added", $"Added tag {tag.Name}.");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tag assigned successfully." });
        }

        [HttpDelete("{id:int}/tags/{tagId:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveTag(int id, int tagId)
        {
            var assignment = await _context.ContactTagAssignments
                .Include(a => a.Tag)
                .FirstOrDefaultAsync(a => a.ContactId == id && a.TagId == tagId && a.Contact.Organization.Type == DepartmentType);
            if (assignment == null)
            {
                return NotFound(new { message = "Person tag assignment not found." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var tagName = assignment.Tag.Name;
            _context.ContactTagAssignments.Remove(assignment);
            _activityLogger.Add(userId.Value, PersonEntityType, id, "Tag removed", $"Removed tag {tagName}.");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tag removed successfully." });
        }

        [HttpGet("{id:int}/projects")]
        public async Task<ActionResult<IEnumerable<PersonProjectResponse>>> GetRelatedProjects(int id)
        {
            var person = await _context.Contacts
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id && c.Organization.Type == DepartmentType);
            if (person == null)
            {
                return NotFound(new { message = "Person not found." });
            }

            var projects = await _context.Projects
                .AsNoTracking()
                .Where(p => p.CustomerId == person.OrganizationId)
                .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
                .Select(p => new PersonProjectResponse
                {
                    Id = p.Id,
                    Name = p.Name,
                    Status = p.Status,
                    Priority = p.Priority,
                    StartDate = p.StartDate,
                    DueDate = p.DueDate
                })
                .ToListAsync();
            return Ok(projects);
        }

        [HttpGet("{id:int}/timeline")]
        public async Task<ActionResult<IEnumerable<PersonActivityResponse>>> GetTimeline(int id)
        {
            if (!await PersonExistsAsync(id))
            {
                return NotFound(new { message = "Person not found." });
            }

            var activities = await _context.Activities
                .AsNoTracking()
                .Where(a => a.EntityType == PersonEntityType && a.EntityId == id)
                .OrderByDescending(a => a.CreatedAt)
                .Select(a => new PersonActivityResponse
                {
                    Id = a.Id,
                    UserId = a.UserId,
                    UserName = a.User.FullName,
                    Action = a.Action,
                    Description = a.Description,
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();
            return Ok(activities);
        }

        private Task<Customer?> GetDepartmentAsync(int departmentId) =>
            _context.Customers.FirstOrDefaultAsync(d => d.Id == departmentId && d.Type == DepartmentType);

        private Task<bool> PersonExistsAsync(int id) =>
            _context.Contacts.AsNoTracking().AnyAsync(c => c.Id == id && c.Organization.Type == DepartmentType);

        private async Task ClearOtherPrimaryContactsAsync(int departmentId, int? exceptPersonId, DateTime now)
        {
            var query = _context.Contacts.Where(c => c.OrganizationId == departmentId && c.IsPrimary);
            if (exceptPersonId.HasValue)
            {
                query = query.Where(c => c.Id != exceptPersonId.Value);
            }

            var currentPrimaryContacts = await query.ToListAsync();
            foreach (var currentPrimary in currentPrimaryContacts)
            {
                currentPrimary.IsPrimary = false;
                currentPrimary.UpdatedAt = now;
            }
        }

        private static string? NormalizeOptional(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string? NormalizeEmail(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();

        private static string Truncate(string value, int length) =>
            value.Length <= length ? value : value[..length] + "…";

        private static PersonResponse ToResponse(Contact person, string departmentName) => new()
        {
            Id = person.Id,
            DepartmentId = person.OrganizationId,
            DepartmentName = departmentName,
            Name = person.Name,
            JobTitle = person.JobTitle,
            Email = person.Email,
            Phone = person.Phone,
            IsPrimary = person.IsPrimary,
            CreatedAt = person.CreatedAt,
            UpdatedAt = person.UpdatedAt
        };
    }
}
