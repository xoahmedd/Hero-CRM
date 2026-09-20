using CRM.API.Data;
using CRM.API.DTOs.Organization;
using CRM.API.Models;
using CRM.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM.API.Controllers
{
    [ApiController]
    [Route("api/Organizations/{organizationId:int}/notes")]
    [Authorize(Roles = "Admin")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public class OrganizationNotesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ActivityLogger _activityLogger;

        public OrganizationNotesController(
            ApplicationDbContext context,
            ActivityLogger activityLogger)
        {
            _context = context;
            _activityLogger = activityLogger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<OrganizationNoteResponse>>> GetNotes(int organizationId)
        {
            var exists = await _context.Customers
                .AsNoTracking()
                .AnyAsync(o => o.Id == organizationId);

            if (!exists)
            {
                return NotFound(new { message = "Organization not found." });
            }

            var notes = await _context.OrganizationNotes
                .AsNoTracking()
                .Include(n => n.User)
                .Where(n => n.OrganizationId == organizationId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notes.Select(ToResponse));
        }

        [HttpPost]
        public async Task<ActionResult<OrganizationNoteResponse>> CreateNote(
            int organizationId,
            CreateOrganizationNoteRequest request)
        {
            var organization = await _context.Customers
                .AsNoTracking()
                .FirstOrDefaultAsync(o => o.Id == organizationId);

            if (organization == null)
            {
                return NotFound(new { message = "Organization not found." });
            }

            var userId = AccessControlService.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var note = new OrganizationNote
            {
                OrganizationId = organizationId,
                UserId = userId.Value,
                Content = request.Content.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.OrganizationNotes.Add(note);
            _activityLogger.Add(
                userId.Value,
                "Organization",
                organizationId,
                "Note added",
                note.Content.Length <= 180 ? note.Content : note.Content[..180] + "…");

            await _context.SaveChangesAsync();

            var savedNote = await _context.OrganizationNotes
                .AsNoTracking()
                .Include(n => n.User)
                .FirstAsync(n => n.Id == note.Id);

            return Ok(ToResponse(savedNote));
        }

        [HttpPut("{noteId:int}")]
        public async Task<IActionResult> UpdateNote(
            int organizationId,
            int noteId,
            CreateOrganizationNoteRequest request)
        {
            var note = await _context.OrganizationNotes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.OrganizationId == organizationId);

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

            _activityLogger.Add(
                userId.Value,
                "Organization",
                organizationId,
                "Note updated",
                "Updated an organization note.");

            await _context.SaveChangesAsync();

            return Ok(new { message = "Note updated successfully." });
        }

        [HttpDelete("{noteId:int}")]
        public async Task<IActionResult> DeleteNote(int organizationId, int noteId)
        {
            var note = await _context.OrganizationNotes
                .FirstOrDefaultAsync(n => n.Id == noteId && n.OrganizationId == organizationId);

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
            _activityLogger.Add(
                userId.Value,
                "Organization",
                organizationId,
                "Note removed",
                "Removed an organization note.");

            await _context.SaveChangesAsync();

            return Ok(new { message = "Note deleted successfully." });
        }

        private static OrganizationNoteResponse ToResponse(OrganizationNote n)
        {
            return new OrganizationNoteResponse
            {
                Id = n.Id,
                OrganizationId = n.OrganizationId,
                UserId = n.UserId,
                UserName = n.User.FullName,
                Content = n.Content,
                CreatedAt = n.CreatedAt,
                UpdatedAt = n.UpdatedAt
            };
        }
    }
}
