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
                    Priority = e.Priority,
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
                Priority = ev.Priority,
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
                Priority = req.Priority,
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
                Priority = ev.Priority,
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
            ev.StartTime = req.StartTime;
            ev.EndTime = req.EndTime;
            ev.Location = req.Location;
            ev.IsAllDay = req.IsAllDay;
            ev.Priority = req.Priority;

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

            var now = DateTime.UtcNow;
            var end = now.AddDays(30);

            var existingEvents = await _db.CalendarEvents
                .Where(e => e.UserId == userId && e.StartTime >= now && e.StartTime <= end)
                .OrderBy(e => e.StartTime)
                .Select(e => new
                {
                    sourceType = "calendar",
                    title = e.Title,
                    description = e.Description,
                    startTime = e.StartTime,
                    endTime = e.EndTime,
                    sortKey = e.StartTime
                })
                .ToListAsync();

            var tasks = await _db.Tasks
                .Where(t => t.UserId == userId && t.Status != "completed" && t.DueDate != null && t.DueDate >= now)
                .OrderBy(t => t.DueDate)
                .Select(t => new
                {
                    sourceType = "task",
                    title = t.Title,
                    description = t.Description,
                    startTime = t.DueDate!.Value,
                    endTime = t.DueDate!.Value.AddHours(1),
                    sortKey = t.DueDate!.Value
                })
                .ToListAsync();

            // ════════════════════════════════════════════════════════════════════
            // PHẦN 1: 3 mục gần nhất — LẤY THẲNG TỪ DB, KHÔNG QUA AI (chính xác 100%)
            // ════════════════════════════════════════════════════════════════════
            var nearestItems = existingEvents
                .Concat(tasks)
                .OrderBy(x => x.sortKey)
                .Take(3)
                .Select(x => new
                {
                    id = Guid.NewGuid().ToString(),
                    sourceType = x.sourceType,
                    title = x.title,
                    description = x.description,
                    startTime = x.startTime,
                    endTime = x.endTime,
                })
                .ToList();

            // ════════════════════════════════════════════════════════════════════
            // PHẦN 2: AI gợi ý hoạt động nên làm hôm nay, TRÁNH giờ đã có lịch/task
            // ════════════════════════════════════════════════════════════════════
            var todayStart = now.Date;
            var todayEnd = todayStart.AddDays(1);

            var busySlotsToday = existingEvents
                .Where(e => e.startTime >= todayStart && e.startTime < todayEnd)
                .Select(e => new { e.title, e.startTime, e.endTime })
                .Concat(tasks
                    .Where(t => t.startTime >= todayStart && t.startTime < todayEnd)
                    .Select(t => new { t.title, t.startTime, t.endTime }))
                .OrderBy(x => x.startTime)
                .ToList();

            var busyJson = JsonSerializer.Serialize(busySlotsToday);
            var nowVn = now.AddHours(7);

            var prompt = $$"""
    Bạn là AI Scheduling Assistant.

    Thời gian hiện tại: {{nowVn:yyyy-MM-dd HH:mm}} (+07:00)

    Đây là các khoảng thời gian ĐÃ BỊ CHIẾM trong hôm nay (lịch + task có sẵn):

    {{busyJson}}

    Yêu cầu:
    - Đề xuất TỐI ĐA 3 hoạt động nên làm hôm nay (ví dụ: nghỉ ngơi, chuẩn bị cho việc tiếp theo, tập thể dục, ăn uống, đọc sách...).
    - Mỗi hoạt động phải xếp vào KHOẢNG TRỐNG còn lại trong ngày, KHÔNG được trùng với các khoảng thời gian đã bị chiếm ở trên.
    - Đưa ra khung giờ cụ thể (ví dụ: "19:00 - 19:30") cho mỗi hoạt động trong nội dung description.
    - Không lặp lại các title đã có trong danh sách bị chiếm.

    Chỉ trả về đúng JSON, không markdown, không giải thích:

    {
      "aiRecommendations": [
        "Nội dung gợi ý 1, có kèm khung giờ cụ thể...",
        "Nội dung gợi ý 2...",
        "Nội dung gợi ý 3..."
      ]
    }
    """;

            try
            {
                var raw = await _groq.ChatAsync(prompt);

                var cleaned = raw.Trim();
                if (cleaned.StartsWith("```"))
                {
                    cleaned = cleaned.Replace("```json", "").Replace("```", "").Trim();
                }
                var first = cleaned.IndexOf('{');
                if (first >= 0) cleaned = cleaned.Substring(first);
                var last = cleaned.LastIndexOf('}');
                if (last >= 0) cleaned = cleaned.Substring(0, last + 1);

                List<string> recommendations = new();
                try
                {
                    using var doc = JsonDocument.Parse(cleaned);
                    if (doc.RootElement.TryGetProperty("aiRecommendations", out var recEl))
                    {
                        foreach (var r in recEl.EnumerateArray())
                        {
                            if (r.ValueKind == JsonValueKind.String)
                                recommendations.Add(r.GetString() ?? "");
                        }
                    }
                }
                catch
                {
                    // Nếu AI trả JSON lỗi, vẫn trả về phần 1 (nearestItems) cho FE,
                    // chỉ để recommendations rỗng — không làm hỏng cả request.
                }

                return Ok(new
                {
                    suggestions = nearestItems,
                    aiRecommendations = recommendations
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());

                // Lỗi gọi Groq vẫn không nên làm mất phần 1 (data thật từ DB)
                return Ok(new
                {
                    suggestions = nearestItems,
                    aiRecommendations = new List<string>(),
                    warning = $"Không lấy được gợi ý AI: {ex.Message}"
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
        public int Priority { get; set; }
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
        public int Priority { get; set; } = 1;
    }

    public class UpdateCalendarEventRequest
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? Location { get; set; }
        public bool IsAllDay { get; set; }
        public int Priority { get; set; } = 1; // 0=Urgent, 1=Normal, 2=Low
    }
}