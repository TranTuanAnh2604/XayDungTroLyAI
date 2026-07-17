using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Assistant.Models;
using Assistant.Services;
using System.Security.Claims;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Assistant.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CalendarController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly GroqService _groq;
        private readonly ScheduleConflictService _conflict;

        public CalendarController(AppDbContext db, GroqService groq, ScheduleConflictService conflict)
        {
            _db = db;
            _groq = groq;
            _conflict = conflict;
        }
        private static byte MapCalendarPriorityToTaskPriority(int calendarPriority) => calendarPriority switch
        {
            0 => 3, // Urgent
            2 => 1, // Low
            _ => 2, // Normal
        };

        [HttpGet]
        public async Task<IActionResult> GetEvents([FromQuery] int? year, [FromQuery] int? month)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var query = _db.CalendarEvents.Where(e => e.UserId == userId);
            var vnNow = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);
            var sevenDaysLimit = vnNow.AddDays(7);

            // Task đã có Event liên kết -> đã hiển thị qua bảng CalendarEvents rồi, không merge lại (tránh trùng)
            // Chỉ merge task còn lại trong vòng 7 ngày tới, để không rối lịch khi xem xa cả tháng
            var taskQuery = _db.Tasks.Where(t => t.UserId == userId
                && t.DueDate != null
                && t.CalendarEventId == null
                && t.DueDate <= sevenDaysLimit);

            if (year.HasValue && month.HasValue)
            {
                var start = DateTime.SpecifyKind(new DateTime(year.Value, month.Value, 1), DateTimeKind.Utc);
                var end = DateTime.SpecifyKind(start.AddMonths(1), DateTimeKind.Utc);
                query = query.Where(e => e.StartTime < end && e.EndTime >= start);
                taskQuery = taskQuery.Where(t => t.DueDate < end && t.DueDate >= start);
            }

            var events = await query
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

            var taskEvents = await taskQuery
                .Select(t => new CalendarEventDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    StartTime = t.DueDate!.Value,
                    EndTime = t.DueDate!.Value.AddMinutes(30),
                    Location = null,
                    Source = "task",
                    IsAllDay = false,
                    Priority = t.Priority == 3 ? 0 : t.Priority == 1 ? 2 : 1,
                })
                .ToListAsync();

            var merged = events.Concat(taskEvents).OrderBy(e => e.StartTime).ToList();

            return Ok(merged);
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

            var start = DateTime.SpecifyKind(req.StartTime, DateTimeKind.Utc);
            var end = DateTime.SpecifyKind(req.EndTime, DateTimeKind.Utc);

            if (!req.IgnoreConflict)
            {
                var conflicts = await _conflict.FindConflictsAsync(userId, start, end);
                if (conflicts.Count > 0)
                {
                    return Conflict(new
                    {
                        conflict = true,
                        message = "Trùng giờ với lịch/task khác. Vẫn muốn tạo?",
                        conflicts
                    });
                }
            }

            var ev = new CalendarEvent
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = req.Title,
                Description = req.Description,
                StartTime = start,
                EndTime = end,
                Location = req.Location,
                Source = req.Source ?? "manual",
                IsAllDay = req.IsAllDay,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc),
                Priority = req.Priority,
            };

            _db.CalendarEvents.Add(ev);

            // Chỉ tự tạo Task liên kết nếu Event KHÔNG nằm trong quá khứ (so với giờ VN hiện tại)
            var vnNow = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);
            if (ev.StartTime >= vnNow)
            {
                var autoTask = new Assistant.Models.Task
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Title = ev.Title,
                    Description = ev.Description,
                    Priority = MapCalendarPriorityToTaskPriority(ev.Priority),
                    Status = "pending",
                    DueDate = ev.StartTime,
                    InputMethod = "calendar",
                    CalendarEventId = ev.Id,
                    CreatedAt = vnNow,
                };
                _db.Tasks.Add(autoTask);
            }

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

            // Đồng bộ task liên kết (nếu còn tồn tại và chưa hoàn thành)
            var linkedTask = await _db.Tasks
                .FirstOrDefaultAsync(t => t.CalendarEventId == ev.Id && t.UserId == userId);
            if (linkedTask != null && linkedTask.Status != "done")
            {
                linkedTask.Title = ev.Title;
                linkedTask.Description = ev.Description;
                linkedTask.DueDate = ev.StartTime;
                linkedTask.Priority = MapCalendarPriorityToTaskPriority(ev.Priority);
            }

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

            var linkedTask = await _db.Tasks
                .FirstOrDefaultAsync(t => t.CalendarEventId == ev.Id && t.UserId == userId);

            if (linkedTask != null)
            {
                if (linkedTask.Status == "done")
                    linkedTask.CalendarEventId = null; // giữ lại lịch sử, chỉ gỡ liên kết
                else
                    _db.Tasks.Remove(linkedTask); // chưa xong thì xóa theo event
            }

            _db.CalendarEvents.Remove(ev);
            await _db.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("ai-suggestions")]
        public async Task<IActionResult> GetAiSuggestions()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId)) return Unauthorized();

            var vnNow = DateTime.UtcNow.AddHours(7);

            var todayStart = vnNow.Date;
            var todayEnd = todayStart.AddDays(1);
            var rangeEnd = vnNow.AddDays(30);

            var existingEvents = await _db.CalendarEvents
                .Where(e => e.UserId == userId && e.EndTime >= vnNow && e.StartTime <= rangeEnd)
                .OrderBy(e => e.StartTime)
                .Select(e => new
                {
                    sourceType = "calendar",
                    title = e.Title,
                    description = e.Description,
                    startTime = e.StartTime,
                    endTime = e.EndTime,
                    sortKey = e.StartTime,
                    priority = e.Priority
                })
                .ToListAsync();

            var tasks = await _db.Tasks
                .Where(t => t.UserId == userId
                    && t.Status != "done"                 
                    && t.CalendarEventId == null
                    && t.DueDate != null
                    && t.DueDate >= vnNow)
                .OrderBy(t => t.DueDate)
                .Select(t => new
                {
                    sourceType = "task",
                    title = t.Title,
                    description = t.Description,
                    startTime = t.DueDate!.Value,
                    endTime = t.DueDate!.Value.AddHours(1),
                    sortKey = t.DueDate!.Value,
                    priority = t.Priority == 3 ? 0 : t.Priority == 1 ? 2 : 1
                })
                .ToListAsync();

            var nearestItems = existingEvents
                .Concat(tasks)
                .Where(x => x.startTime >= vnNow)
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
                    priority = x.priority,
                })
                .ToList();

            var busySlotsToday = existingEvents
                .Concat(tasks)
                .Where(x => x.startTime < todayEnd && x.endTime > todayStart && x.endTime > vnNow)
                .Select(x => new { x.title, x.startTime, x.endTime })
                .OrderBy(x => x.startTime)
                .ToList();

            var workStart = todayStart.AddHours(6);
            var workEnd = todayStart.AddHours(22.5);
            var dayStart = vnNow > workStart ? vnNow : workStart;

            var freeWindows = new List<(DateTime Start, DateTime End)>();
            var current = dayStart;

            foreach (var slot in busySlotsToday)
            {
                var s = slot.startTime < workStart ? workStart : slot.startTime;
                var e = slot.endTime > workEnd ? workEnd : slot.endTime;
                if (e <= current) continue;

                if (s > current)
                    freeWindows.Add((current, s));

                if (e > current)
                    current = e;
            }
            if (current < workEnd)
                freeWindows.Add((current, workEnd));

            freeWindows = freeWindows.Where(w => (w.End - w.Start).TotalMinutes >= 15).ToList();

            if (freeWindows.Count == 0)
            {
                return Ok(new { suggestions = nearestItems, aiRecommendations = new List<string>() });
            }

            var freeWindowsForPrompt = freeWindows
                .Select(w => $"{w.Start:HH:mm} - {w.End:HH:mm}")
                .ToList();

            var busyForPrompt = busySlotsToday
                .Select(b => $"{b.startTime:HH:mm} - {b.endTime:HH:mm}: {b.title}")
                .ToList();

            var rng = Random.Shared;
            var anchorTimes = new List<DateTime>();

            var candidatePool = new List<DateTime>();
            foreach (var w in freeWindows)
            {
                var totalMinutes = (int)(w.End - w.Start).TotalMinutes;
                if (totalMinutes < 15) continue;

                for (int i = 0; i < 5; i++)
                {
                    var offset = rng.Next(0, totalMinutes - 15 + 1);
                    offset = (offset / 5) * 5;
                    candidatePool.Add(w.Start.AddMinutes(offset));
                }
            }

            var shuffledAnchors = candidatePool.OrderBy(_ => rng.Next()).ToList();
            foreach (var t in shuffledAnchors)
            {
                if (anchorTimes.Count >= 3) break;
                bool tooClose = anchorTimes.Any(a => Math.Abs((a - t).TotalMinutes) < 90);
                if (!tooClose) anchorTimes.Add(t);
            }
            if (anchorTimes.Count < 3)
            {
                foreach (var t in shuffledAnchors)
                {
                    if (anchorTimes.Count >= 3) break;
                    if (!anchorTimes.Contains(t)) anchorTimes.Add(t);
                }
            }
            anchorTimes = anchorTimes.OrderBy(t => t).ToList();

            var anchorsForPrompt = anchorTimes.Select(t => $"{t:HH:mm}").ToList();
            var nonce = Guid.NewGuid().ToString("N").Substring(0, 8);

            var prompt = $$"""
Bạn là AI Scheduling Assistant. (mã phiên: {{nonce}})

Giờ hiện tại (VN): {{vnNow:yyyy-MM-dd HH:mm}}

Lịch/công việc ĐÃ CÓ hôm nay (KHÔNG được đề xuất đè lên):
{{JsonSerializer.Serialize(busyForPrompt)}}

Các khoảng RẢNH có thể dùng:
{{JsonSerializer.Serialize(freeWindowsForPrompt)}}

Đây là các MỐC GIỜ BẮT ĐẦU gợi ý (đã tính sẵn, nằm trong khung rảnh):
{{JsonSerializer.Serialize(anchorsForPrompt)}}

YÊU CẦU:
1. Với MỖI mốc giờ ở trên, đề xuất 1 hoạt động phù hợp bắt đầu QUANH mốc đó (được phép lùi/đẩy tối đa 10 phút để hợp lý hơn, nhưng vẫn phải nằm trong khung rảnh và không đè lên lịch đã có).
2. Mỗi hoạt động dài 15-90 phút.
3. Không được chọn 2 hoạt động chồng giờ nhau.
4. Chỉ trả JSON, không thêm chữ nào khác:
{
    "aiRecommendations": [
        "09:05 - 09:35: Đi dạo."
    ]
}
""";

            try
            {
                var raw = await _groq.ChatAsync(prompt);

                var cleaned = raw.Trim();
                if (cleaned.StartsWith("```"))
                    cleaned = cleaned.Replace("```json", "").Replace("```", "").Trim();

                var first = cleaned.IndexOf('{');
                if (first >= 0) cleaned = cleaned.Substring(first);
                var last = cleaned.LastIndexOf('}');
                if (last >= 0) cleaned = cleaned.Substring(0, last + 1);

                var validated = new List<(DateTime Start, DateTime End, string Text)>();

                try
                {
                    using var doc = JsonDocument.Parse(cleaned);
                    if (doc.RootElement.TryGetProperty("aiRecommendations", out var recEl))
                    {
                        foreach (var r in recEl.EnumerateArray())
                        {
                            if (r.ValueKind != JsonValueKind.String) continue;
                            var text = r.GetString() ?? "";

                            var match = Regex.Match(text, @"(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})");
                            if (!match.Success) continue;

                            if (!TimeSpan.TryParse(match.Groups[1].Value, out var startTod)) continue;
                            if (!TimeSpan.TryParse(match.Groups[2].Value, out var endTod)) continue;

                            var start = todayStart + startTod;
                            var end = todayStart + endTod;
                            if (end <= start) continue;

                            var duration = (end - start).TotalMinutes;
                            if (duration < 15 || duration > 90) continue;

                            bool insideFreeWindow = freeWindows.Any(w => start >= w.Start && end <= w.End);
                            if (!insideFreeWindow) continue;

                            bool overlapsPicked = validated.Any(v => start < v.End && end > v.Start);
                            if (overlapsPicked) continue;

                            validated.Add((start, end, text));
                        }
                    }
                }
                catch
                {

                }

                var sortedRecommendations = validated
                    .OrderBy(v => v.Start)
                    .Take(3)
                    .Select(v => v.Text)
                    .ToList();

                return Ok(new { suggestions = nearestItems, aiRecommendations = sortedRecommendations });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.ToString());
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
        public bool IgnoreConflict { get; set; } = false;
    }

    public class UpdateCalendarEventRequest
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string? Location { get; set; }
        public bool IsAllDay { get; set; }
        public int Priority { get; set; } = 1;
        public bool IgnoreConflict { get; set; } = false;
    }
}