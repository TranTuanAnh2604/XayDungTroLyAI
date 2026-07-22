using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Assistant.Services;
using Assistant.Wrappers;
using Assistant.Models;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VoiceController : ControllerBase
    {
        private readonly GroqService _groqService;
        private readonly AppDbContext _db;
        private readonly WebSearchService _webSearchService;
        private readonly ScheduleConflictService _conflict;

        public VoiceController(GroqService groqService, AppDbContext db, WebSearchService webSearchService, ScheduleConflictService conflict)
        {
            _groqService = groqService;
            _db = db;
            _webSearchService = webSearchService;
            _conflict = conflict;
        }

        [HttpPost("process")]
        public async Task<IActionResult> ProcessVoice([FromBody] VoiceRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
                return BadRequest(new ApiResponse<string>("Không nhận được nội dung giọng nói!"));

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var vnNow = DateTime.UtcNow.AddHours(7);

            try
            {
                var userDataContext = await BuildUserDataContextAsync(userId, vnNow);
                var (systemPrompt, userPrompt) = BuildVoicePromptParts(request.Text, userDataContext, vnNow);

                string rawAiResponse;
                try
                {
                    rawAiResponse = await _groqService.ChatWithToolsAsync(systemPrompt, userPrompt, _webSearchService);
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new ApiResponse<string>($"Lỗi gọi AI: {ex.Message}"));
                }

                var (aiReply, actions) = ParseAiActionResponse(rawAiResponse);

                Guid? createdTaskId = null;
                Guid? createdEventId = null;
                var localRanges = new List<(DateTime Start, DateTime End, string Title)>();

                bool OverlapsLocal(DateTime s, DateTime e, out string withTitle)
                {
                    foreach (var r in localRanges)
                        if (s < r.End && e > r.Start) { withTitle = r.Title; return true; }
                    withTitle = "";
                    return false;
                }

                // Xử lý "event" trước — luôn tạo kèm Task liên kết (giống ChatController)
                var eventActionTitles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                foreach (var action in actions.Where(a => string.Equals(a.Type, "event", StringComparison.OrdinalIgnoreCase)))
                {
                    try
                    {
                        var evt = BuildEventFromAction(action, userId, vnNow);
                        if (evt == null) continue;

                        var dbConflicts = await _conflict.FindConflictsAsync(userId, evt.StartTime, evt.EndTime);
                        var hasLocalConflict = OverlapsLocal(evt.StartTime, evt.EndTime, out _);
                        // Voice chỉ nói 1 câu -> không cần hỏi lại user, cứ tạo và log cảnh báo vào reply nếu muốn
                        // (có thể bỏ qua bước cảnh báo nếu muốn đơn giản)

                        var linkedTask = new Assistant.Models.Task
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            Title = evt.Title,
                            Description = evt.Description,
                            DueDate = evt.StartTime,
                            Priority = MapTaskPriority(action.Priority),
                            Status = "pending",
                            InputMethod = "voice",
                            CreatedAt = vnNow,
                            CalendarEventId = evt.Id
                        };

                        _db.CalendarEvents.Add(evt);
                        _db.Tasks.Add(linkedTask);
                        localRanges.Add((evt.StartTime, evt.EndTime, evt.Title));
                        eventActionTitles.Add(action.Title.Trim());

                        createdEventId = evt.Id;
                        createdTaskId = linkedTask.Id;
                    }
                    catch { /* bỏ qua action lỗi */ }
                }

                // Xử lý "task" — bỏ qua nếu trùng title với event vừa xử lý
                foreach (var action in actions.Where(a => string.Equals(a.Type, "task", StringComparison.OrdinalIgnoreCase)))
                {
                    try
                    {
                        if (eventActionTitles.Contains(action.Title?.Trim() ?? "")) continue;

                        var task = BuildTaskFromAction(action, userId, vnNow);
                        if (task == null) continue;

                        if (task.DueDate.HasValue)
                        {
                            var start = task.DueDate.Value;
                            var end = start.AddMinutes(30);
                            await _conflict.FindConflictsAsync(userId, start, end); // check, không chặn (voice không hỏi lại được)
                            localRanges.Add((start, end, task.Title));
                        }

                        _db.Tasks.Add(task);
                        createdTaskId = task.Id;
                    }
                    catch { /* bỏ qua action lỗi */ }
                }

                await _db.SaveChangesAsync();

                return Ok(new ApiResponse<VoiceProcessResult>(new VoiceProcessResult
                {
                    Reply = aiReply,
                    TaskCreated = createdTaskId.HasValue,
                    TaskId = createdTaskId,
                    CalendarEventCreated = createdEventId.HasValue,
                    CalendarEventId = createdEventId
                }, "AI đã phản hồi!"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi xử lý AI: {ex.Message}"));
            }
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveTranscript([FromBody] SaveTranscriptDto request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var record = new VoiceTranscript
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Transcript = request.Transcript,
                AiResponse = request.AiResponse,
                CreatedAt = DateTime.UtcNow.AddHours(7) // giờ VN, khớp convention toàn project
            };

            _db.VoiceTranscripts.Add(record);
            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object>(new { id = record.Id }, "Đã lưu transcript!"));
        }

        // ═══════════════════════════════════════════════════════════════════
        // MỚI: HELPER XÂY DỰNG CONTEXT DỮ LIỆU USER (copy logic từ ChatController
        // để AI trong Voice cũng biết Task/Event/UserMemory, trả lời được câu hỏi
        // liên quan sở thích cá nhân, việc đang làm, lịch sắp tới...)
        // ═══════════════════════════════════════════════════════════════════

        private async Task<string> BuildUserDataContextAsync(Guid userId, DateTime vnNow)
        {
            var todayStart = vnNow.Date;
            var weekEnd = todayStart.AddDays(7);

            var tasks = await _db.Tasks
                .Where(t => t.UserId == userId && t.Status != "done")
                .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
                .ThenByDescending(t => t.Priority)
                .Take(30)
                .ToListAsync();

            var events = await _db.CalendarEvents
                .Where(e => e.UserId == userId && e.StartTime >= todayStart && e.StartTime <= weekEnd)
                .OrderBy(e => e.StartTime)
                .Take(30)
                .ToListAsync();

            var memories = await _db.UserMemories
                .Where(m => m.UserId == userId && m.Category != "OAuth") // không lộ token nội bộ vào prompt
                .OrderByDescending(m => m.UpdatedAt)
                .Take(30)
                .ToListAsync();

            if (tasks.Count == 0 && events.Count == 0 && memories.Count == 0)
                return string.Empty;

            var sb = new StringBuilder();
            sb.AppendLine("=== DỮ LIỆU THỰC TẾ CỦA NGƯỜI DÙNG (chỉ dùng để trả lời, KHÔNG bịa thêm) ===");
            sb.AppendLine($"Hôm nay là: {vnNow:dd/MM/yyyy} ({GetVietnameseDayOfWeek(vnNow.DayOfWeek)}), giờ hiện tại: {vnNow:HH:mm}");

            if (tasks.Count > 0)
            {
                sb.AppendLine("\n-- Công việc (task) chưa hoàn thành --");
                foreach (var t in tasks)
                {
                    var due = t.DueDate.HasValue ? t.DueDate.Value.ToString("dd/MM/yyyy HH:mm") : "chưa có hạn";
                    var overdueFlag = (t.DueDate.HasValue && t.DueDate.Value < vnNow) ? " [QUÁ HẠN]" : "";
                    sb.AppendLine($"- \"{t.Title}\" | Hạn: {due}{overdueFlag} | Ưu tiên: {GetTaskPriorityLabel(t.Priority)} | Trạng thái: {t.Status}");
                }
            }

            if (events.Count > 0)
            {
                sb.AppendLine("\n-- Sự kiện lịch (7 ngày tới) --");
                foreach (var e in events)
                {
                    var time = e.IsAllDay
                        ? e.StartTime.ToString("dd/MM/yyyy") + " (cả ngày)"
                        : $"{e.StartTime:dd/MM/yyyy HH:mm} - {e.EndTime:HH:mm}";
                    var loc = string.IsNullOrWhiteSpace(e.Location) ? "" : $" | Địa điểm: {e.Location}";
                    sb.AppendLine($"- \"{e.Title}\" | {time} | Ưu tiên: {GetCalendarPriorityLabel(e.Priority)}{loc}");
                }
            }

            if (memories.Count > 0)
            {
                sb.AppendLine("\n-- Thông tin đã ghi nhớ về người dùng (sở thích, thói quen...) --");
                foreach (var m in memories)
                {
                    sb.AppendLine($"- {m.Category}/{m.Key}: {m.Value}");
                }
            }

            sb.AppendLine("=== HẾT DỮ LIỆU ===\n");
            return sb.ToString();
        }

        private static string GetTaskPriorityLabel(byte priority) => priority switch
        {
            3 => "Khẩn cấp",
            2 => "Bình thường",
            1 => "Thấp",
            _ => "Bình thường"
        };

        private static string GetCalendarPriorityLabel(int priority) => priority switch
        {
            0 => "Khẩn cấp",
            1 => "Bình thường",
            2 => "Thấp",
            _ => "Bình thường"
        };

        private static string GetVietnameseDayOfWeek(DayOfWeek day) => day switch
        {
            DayOfWeek.Monday => "Thứ Hai",
            DayOfWeek.Tuesday => "Thứ Ba",
            DayOfWeek.Wednesday => "Thứ Tư",
            DayOfWeek.Thursday => "Thứ Năm",
            DayOfWeek.Friday => "Thứ Sáu",
            DayOfWeek.Saturday => "Thứ Bảy",
            DayOfWeek.Sunday => "Chủ Nhật",
            _ => ""
        };

        private (string systemPrompt, string userPrompt) BuildVoicePromptParts(string spokenText, string? userDataContext, DateTime vnNow)
        {
            var sys = new StringBuilder();
            sys.AppendLine("Bạn là trợ lý AI cá nhân, xử lý lệnh giọng nói bằng tiếng Việt.");
            sys.AppendLine("Ngoài trả lời bình thường, bạn có thể NHẬN DIỆN khi người dùng muốn:");
            sys.AppendLine("- Thêm một CÔNG VIỆC cần làm (task), HOẶC");
            sys.AppendLine("- Thêm một SỰ KIỆN vào lịch (event), HOẶC cả hai.");
            sys.AppendLine("Nếu câu hỏi cần thông tin real-time (thời tiết, tin tức, giá cả...), hãy dùng tool trước khi trả lời.");
            sys.AppendLine("CHÚ Ý QUAN TRỌNG: Tool DUY NHẤT bạn được phép gọi là 'web_search'. Việc tạo CÔNG VIỆC hay SỰ KIỆN KHÔNG phải là tool call — đó chỉ là dữ liệu bạn điền vào trường \"actions\" trong JSON trả lời cuối cùng.");
            sys.AppendLine("QUAN TRỌNG: câu trả lời CUỐI CÙNG phải là JSON DUY NHẤT, không markdown, đúng cấu trúc:");
            sys.AppendLine(@"{
  ""reply"": ""câu trả lời tự nhiên, ngắn gọn (vì đây là trợ lý giọng nói)"",
  ""actions"": [ { ""type"": ""task hoặc event"", ""title"": ""..."", ""date"": ""yyyy-MM-dd"", ""time"": ""HH:mm hoặc null"", ""endTime"": ""HH:mm hoặc null"", ""isAllDay"": false, ""priority"": ""urgent|normal|low"", ""location"": ""... hoặc null"" } ]
}");
            sys.AppendLine("Nếu không có ý định thêm task/lịch, trả \"actions\": [].");
            sys.AppendLine($"Hôm nay là {vnNow:dd/MM/yyyy} ({GetVietnameseDayOfWeek(vnNow.DayOfWeek)}), giờ hiện tại {vnNow:HH:mm}.");

            if (!string.IsNullOrEmpty(userDataContext))
                sys.AppendLine(userDataContext);

            var usr = new StringBuilder();
            usr.AppendLine($"Người dùng (giọng nói): {spokenText}");

            return (sys.ToString(), usr.ToString());
        }

        private (string reply, List<AiAction> actions) ParseAiActionResponse(string raw)
        {
            var cleaned = raw.Trim();
            if (cleaned.StartsWith("```"))
            {
                var firstNewline = cleaned.IndexOf('\n');
                if (firstNewline >= 0) cleaned = cleaned[(firstNewline + 1)..];
                var lastFence = cleaned.LastIndexOf("```");
                if (lastFence >= 0) cleaned = cleaned[..lastFence];
                cleaned = cleaned.Trim();
            }

            var parsed = TryParseAction(cleaned);
            if (parsed != null) return (parsed.Reply, parsed.Actions ?? new List<AiAction>());

            var firstBrace = cleaned.IndexOf('{');
            var lastBrace = cleaned.LastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace)
            {
                var jsonSlice = cleaned[firstBrace..(lastBrace + 1)];
                parsed = TryParseAction(jsonSlice);
                if (parsed != null) return (parsed.Reply, parsed.Actions ?? new List<AiAction>());
            }

            return (raw, new List<AiAction>());
        }

        private AiActionResponse? TryParseAction(string text)
        {
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var parsed = JsonSerializer.Deserialize<AiActionResponse>(text, options);
                if (parsed != null && !string.IsNullOrWhiteSpace(parsed.Reply)) return parsed;
            }
            catch { }
            return null;
        }

        private static DateTime? ParseDateTimeVn(string? date, string? time, bool isAllDay)
        {
            if (string.IsNullOrWhiteSpace(date)) return null;
            if (!DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var d))
                return null;
            if (isAllDay || string.IsNullOrWhiteSpace(time)) return d.Date;
            if (TimeSpan.TryParse(time, out var t)) return d.Date.Add(t);
            return d.Date;
        }

        private static byte MapTaskPriority(string? priority) => priority?.Trim().ToLowerInvariant() switch
        {
            "urgent" => 3,
            "low" => 1,
            _ => 2
        };

        private static int MapEventPriority(string? priority) => priority?.Trim().ToLowerInvariant() switch
        {
            "urgent" => 0,
            "low" => 2,
            _ => 1
        };

        private Assistant.Models.Task? BuildTaskFromAction(AiAction action, Guid userId, DateTime vnNow)
        {
            if (string.IsNullOrWhiteSpace(action.Title)) return null;
            var due = ParseDateTimeVn(action.Date, action.Time, action.IsAllDay);

            return new Assistant.Models.Task
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = action.Title.Trim(),
                Description = null,
                DueDate = due,
                Priority = MapTaskPriority(action.Priority),
                Status = "pending",
                InputMethod = "voice",
                CreatedAt = vnNow
            };
        }

        private CalendarEvent? BuildEventFromAction(AiAction action, Guid userId, DateTime vnNow)
        {
            if (string.IsNullOrWhiteSpace(action.Title)) return null;
            var start = ParseDateTimeVn(action.Date, action.Time, action.IsAllDay);
            if (start == null) return null;

            DateTime end;
            if (action.IsAllDay) end = start.Value.Date;
            else if (!string.IsNullOrWhiteSpace(action.EndTime)) end = ParseDateTimeVn(action.Date, action.EndTime, false) ?? start.Value.AddHours(1);
            else end = start.Value.AddHours(1);

            if (end <= start.Value) end = start.Value.AddHours(1);

            return new CalendarEvent
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = action.Title.Trim(),
                Description = null,
                StartTime = start.Value,
                EndTime = end,
                Location = action.Location,
                Source = "voice",
                IsAllDay = action.IsAllDay,
                Priority = MapEventPriority(action.Priority),
                CreatedAt = vnNow
            };
        }
    }

    public class VoiceRequestDto { public string Text { get; set; } = null!; }
    public class SaveTranscriptDto
    {
        public string Transcript { get; set; } = null!;
        public string? AiResponse { get; set; }
    }
    public class VoiceProcessResult
    {
        public string Reply { get; set; } = null!;
        public bool TaskCreated { get; set; }
        public Guid? TaskId { get; set; }
        public bool CalendarEventCreated { get; set; }
        public Guid? CalendarEventId { get; set; }
    }
}