using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Assistant.Models;
using Assistant.Services;
using System.Security.Claims;
using System.Text.Json;

namespace Assistant.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CalendarController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly GroqService _groq;

        public CalendarController(AppDbContext db, GroqService groq)
        {
            _db = db;
            _groq = groq;
        }

        [HttpGet]
        public async Task<IActionResult> GetEvents([FromQuery] int? year, [FromQuery] int? month)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var query = _db.CalendarEvents.Where(e => e.UserId == userId);

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

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetEvent(Guid id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var ev = await _db.CalendarEvents
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
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

        [HttpPost]
        public async Task<IActionResult> CreateEvent([FromBody] CreateCalendarEventRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

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

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateCalendarEventRequest req)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var ev = await _db.CalendarEvents
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
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

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteEvent(Guid id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var ev = await _db.CalendarEvents
                .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);
            if (ev is null) return NotFound();

            _db.CalendarEvents.Remove(ev);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("ai-suggestions")]
        public async Task<IActionResult> GetAiSuggestions()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            // Lấy events 30 ngày tới để Groq có ngữ cảnh
            var now = DateTime.UtcNow;
            var end = now.AddDays(30);
            var existingEvents = await _db.CalendarEvents
                .Where(e => e.UserId == userId &&
                            e.StartTime >= now &&
                            e.StartTime <= end)
                .OrderBy(e => e.StartTime)
                .Select(e => new
                {
                    type = "calendar",
                    title = e.Title,
                    description = e.Description,
                    startTime = e.StartTime,
                    endTime = e.EndTime
                })
                .ToListAsync();
            var tasks = await _db.Tasks
                .Where(t => t.UserId == userId &&
                            t.Status != "completed")
                .OrderBy(t => t.DueDate)
                .Select(t => new
                {
                    type = "task",
                    title = t.Title,
                    description = t.Description,
                    dueDate = t.DueDate,
                    priority = t.Priority
                })
                .ToListAsync();

            var calendarJson = JsonSerializer.Serialize(existingEvents);
            var taskJson = JsonSerializer.Serialize(tasks);

            var eventsJson = JsonSerializer.Serialize(existingEvents, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var nowVn = now.AddHours(7);
            var prompt = $$"""
            Bạn là AI Scheduling Assistant.

            Thời gian hiện tại:
            {{nowVn:yyyy-MM-dd HH:mm}} (+07:00)

            Đây là danh sách Calendar Event:

            {{calendarJson}}

            Đây là danh sách Task:

            {{taskJson}}

            Yêu cầu:

            - Chỉ sử dụng dữ liệu đã cung cấp.
            - Không được tự tạo task hoặc calendar mới.
            - Chọn tối đa 3 mục gần nhất theo thứ tự:
                1. Calendar Event gần nhất
                2. Calendar Event gần kế tiếp
                3. Calendar Event gần tiếp theo đó
            - Giữ nguyên title.
            - Không sửa thời gian.
            - Nếu là Task:
                sourceType = "task"
                startTime = dueDate
                endTime = dueDate + 1 giờ
            - Nếu là Calendar:
                sourceType = "chat"
                startTime = startTime
                endTime = endTime

            Sau đó tạo tối đa 3 lời khuyên trong các chủ đề:
            - Nghỉ ngơi
            - Chuẩn bị họp
            - Tập thể dục

            Chỉ trả về đúng JSON:

            {
              "suggestions":[...],
              "aiRecommendations":[...]
            }

            Không markdown.
            Không giải thích.
            Không thêm bất kỳ chữ nào ngoài JSON.
            """;
            try
            {
                var raw = await _groq.ChatAsync(prompt);

                Console.WriteLine("===== RAW GROQ =====");
                Console.WriteLine(raw);
                Console.WriteLine("====================");

                var cleaned = raw.Trim();

                // bỏ markdown
                if (cleaned.StartsWith("```"))
                {
                    cleaned = cleaned
                        .Replace("```json", "")
                        .Replace("```", "")
                        .Trim();
                }

                // nếu Groq nói thêm text trước JSON
                var first = cleaned.IndexOf('{');

                if (first >= 0)
                {
                    cleaned = cleaned.Substring(first);
                }

                // nếu Groq nói thêm sau JSON
                var last = cleaned.LastIndexOf('}');

                if (last >= 0)
                {
                    cleaned = cleaned.Substring(0, last + 1);
                }

                JsonDocument doc;

                try
                {
                    doc = JsonDocument.Parse(cleaned);
                }
                catch
                {
                    return BadRequest(new
                    {
                        error = "Groq không trả JSON",
                        raw = cleaned
                    });
                }

                if (!doc.RootElement.TryGetProperty("suggestions", out var suggestions))
                {
                    return BadRequest(new
                    {
                        error = "Không tìm thấy suggestions",
                        raw = cleaned
                    });
                }

                // clone trước khi dispose
                var result = suggestions.Clone();

                doc.Dispose();

                // Trả về ARRAY
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());

                return StatusCode(500, new
                {
                    error = ex.Message,
                    stack = ex.ToString()
                });
            }
        }
    }

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
}