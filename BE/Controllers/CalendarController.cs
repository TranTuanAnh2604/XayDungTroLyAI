using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Assistant.Models;

namespace Assistant.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CalendarController : ControllerBase
{
    private readonly AppDbContext _db;

    public CalendarController(AppDbContext db)
    {
        _db = db;
    }

    // ─── GET /api/calendar?year=2025&month=10 ──────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetEvents([FromQuery] int? year, [FromQuery] int? month)
    {
        var userId = await _db.Users.Select(u => u.Id).FirstOrDefaultAsync();

        var query = _db.CalendarEvents
            .Where(e => e.UserId == userId);

        if (year.HasValue && month.HasValue)
        {
            var start = DateTime.SpecifyKind(new DateTime(year.Value, month.Value, 1), DateTimeKind.Utc);
            var end = DateTime.SpecifyKind(start.AddMonths(1), DateTimeKind.Utc);
            query = query.Where(e => e.StartTime < end && e.EndTime >= start);
        }

        var events = await query
            .OrderBy(e => e.StartTime)
            .Select(e => new CalendarEventDto
            {
                Id = e.Id,
                Title = e.Title,
                Description = e.Description,
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                Location = e.Location,
                Source = e.Source,
                IsAllDay = e.IsAllDay,
            })
            .ToListAsync();

        return Ok(events);
    }

    // ─── GET /api/calendar/{id} ────────────────────────────────────────────
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetEvent(Guid id)
    {
        var ev = await _db.CalendarEvents.FindAsync(id);
        if (ev is null) return NotFound();

        return Ok(new CalendarEventDto
        {
            Id = ev.Id,
            Title = ev.Title,
            Description = ev.Description,
            StartTime = ev.StartTime,
            EndTime = ev.EndTime,
            Location = ev.Location,
            Source = ev.Source,
            IsAllDay = ev.IsAllDay,
        });
    }

    // ─── POST /api/calendar ────────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> CreateEvent([FromBody] CreateCalendarEventRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = await _db.Users.Select(u => u.Id).FirstOrDefaultAsync();

        var ev = new CalendarEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Title = req.Title,
            Description = req.Description,
            StartTime = DateTime.SpecifyKind(req.StartTime, DateTimeKind.Utc),
            EndTime = DateTime.SpecifyKind(req.EndTime, DateTimeKind.Utc),
            Location = req.Location,
            Source = req.Source ?? "manual",
            IsAllDay = req.IsAllDay,
            CreatedAt = DateTime.UtcNow,
        };

        _db.CalendarEvents.Add(ev);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetEvent), new { id = ev.Id }, new CalendarEventDto
        {
            Id = ev.Id,
            Title = ev.Title,
            Description = ev.Description,
            StartTime = ev.StartTime,
            EndTime = ev.EndTime,
            Location = ev.Location,
            Source = ev.Source,
            IsAllDay = ev.IsAllDay,
        });
    }

    // ─── PUT /api/calendar/{id} ────────────────────────────────────────────
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateCalendarEventRequest req)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var ev = await _db.CalendarEvents.FindAsync(id);
        if (ev is null) return NotFound();

        ev.Title = req.Title;
        ev.Description = req.Description;
        ev.StartTime = DateTime.SpecifyKind(req.StartTime, DateTimeKind.Utc);
        ev.EndTime = DateTime.SpecifyKind(req.EndTime, DateTimeKind.Utc);
        ev.Location = req.Location;
        ev.IsAllDay = req.IsAllDay;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ─── DELETE /api/calendar/{id} ─────────────────────────────────────────
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        var ev = await _db.CalendarEvents.FindAsync(id);
        if (ev is null) return NotFound();

        _db.CalendarEvents.Remove(ev);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}

// ─── DTOs ──────────────────────────────────────────────────────────────────────

public class CalendarEventDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string Source { get; set; } = null!;
    public bool IsAllDay { get; set; }
    // styleIndex KHÔNG lưu DB — frontend tự quản lý
}

public class CreateCalendarEventRequest
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public string? Source { get; set; }
    public bool IsAllDay { get; set; }
}

public class UpdateCalendarEventRequest
{
    public string Title { get; set; } = null!;
    public string? Description { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Location { get; set; }
    public bool IsAllDay { get; set; }
}