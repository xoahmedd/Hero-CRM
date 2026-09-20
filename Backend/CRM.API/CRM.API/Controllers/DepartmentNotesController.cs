using CRM.API.Data;
using CRM.API.DTOs.Department;
using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/Departments/{departmentId:int}/notes")]
    [Authorize(Roles = "Admin")]
    public class DepartmentNotesController : ControllerBase
    {
        private const string DepartmentType = "Department";
        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;

        public DepartmentNotesController(ApplicationDbContext context, ActivityLogger activityLogger)
        {
            _context = context;
            _activityLogger = activityLogger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<DepartmentNoteResponse>>> GetNotes(int departmentId)
        {
            var exists = await _context.Customers
                .AsNoTracking()
                .AnyAsync(d => d.Id == departmentId && d.Type == DepartmentType);

            if (!exists)
            {
                return NotFound(new { message = "Department not found." });
            }

            var notes = await _context.OrganizationNotes
                .AsNoTracking()
                .Include(n => n.User)
                .Where(n => n.OrganizationId == departmentId)
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new DepartmentNoteResponse
                {
                    Id = n.Id,
                    DepartmentId = n.OrganizationId,
                    UserId = n.UserId,
                    UserName = n.User.FullName,
                    Content = n.Content,
                    CreatedAt = n.CreatedAt,
                    UpdatedAt = n.UpdatedAt
                })
                .ToListAsync();

            return Ok(notes);
        }

        [HttpPost]
        public async Task<ActionResult<DepartmentNoteResponse>> CreateNote(
            int departmentId,
            CreateDepartmentNoteRequest request)
        {
            var department = await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(d => d.Id == departmentId && d.Type == DepartmentType);

            if (department == null)
            {
                return NotFound(new { message = "Department not found." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var note = new OrganizationNote
            {
                OrganizationId = departmentId,
                UserId = userId.Value,
                Content = request.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.OrganizationNotes.Add(note);
            _activityLogger.Add(
                userId.Value,
                "Department",
                departmentId,
                "Note added",
                note.Content.Length <= 180 ? note.Content : note.Content[..180] + "…");

            await _context.SaveChangesAsync();

            var saved = await _context.OrganizationNotes
                .AsNoTracking()
                .Include(n => n.User)
                .FirstAsync(n => n.Id == note.Id);

            return Ok(ToResponse(saved));
        }

        [HttpPut("{noteId:int}")]
        public async Task<IActionResult> UpdateNote(
            int departmentId,
            int noteId,
            CreateDepartmentNoteRequest request)
        {
            var note = await _context.OrganizationNotes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.OrganizationId == departmentId);

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

            note.Content = request.Content.Trim();
            note.UpdatedAt = DateTime.UtcNow;

            _activityLogger.Add(userId.Value, "Department", departmentId, "Note updated", "Updated a department note.");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Note updated successfully." });
        }

        [HttpDelete("{noteId:int}")]
        public async Task<IActionResult> DeleteNote(int departmentId, int noteId)
        {
            var note = await _context.OrganizationNotes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.OrganizationId == departmentId);

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

            _context.OrganizationNotes.Remove(note);
            _activityLogger.Add(userId.Value, "Department", departmentId, "Note removed", "Removed a department note.");
            await _context.SaveChangesAsync();

            return Ok(new { message = "Note deleted successfully." });
        }

        private static DepartmentNoteResponse ToResponse(OrganizationNote n) => new()
        {
            Id = n.Id,
            DepartmentId = n.OrganizationId,
            UserId = n.UserId,
            UserName = n.User.FullName,
            Content = n.Content,
            CreatedAt = n.CreatedAt,
            UpdatedAt = n.UpdatedAt
        };
    }
}
