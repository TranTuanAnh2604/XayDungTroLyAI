using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using Assistant.Models;
using Assistant.Services;
using Assistant.Wrappers;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GroqService _groqService;
        private readonly WebSearchService _webSearchService;
        private readonly ScheduleConflictService _conflict;

        public ChatController(AppDbContext context, GroqService groqService, WebSearchService webSearchService, ScheduleConflictService conflict)
        {
            _context = context;
            _groqService = groqService;
            _webSearchService = webSearchService;
            _conflict = conflict;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // ============ CÁC ENDPOINT SESSION (giữ nguyên) ============

        [HttpGet("sessions")]
        public async Task<IActionResult> GetSessions()
        {
            var userId = GetUserId();
            var sessions = await _context.ChatSessions
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.LastActivity)
                .Select(s => new ChatSessionDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    CreatedAt = s.CreatedAt,
                    LastActivity = s.LastActivity
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<ChatSessionDto>>(sessions, "Lấy danh sách hội thoại thành công!"));
        }

        [HttpPost("sessions")]
        public async Task<IActionResult> CreateSession()
        {
            var userId = GetUserId();
            var session = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = null,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc),
                LastActivity = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc)
            };

            _context.ChatSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<ChatSessionDto>(new ChatSessionDto
            {
                Id = session.Id,
                Title = session.Title,
                CreatedAt = session.CreatedAt,
                LastActivity = session.LastActivity
            }, "Tạo hội thoại mới thành công!"));
        }

        [HttpGet("sessions/{sessionId}/messages")]
        public async Task<IActionResult> GetMessages(Guid sessionId)
        {
            var userId = GetUserId();

            var session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound(new ApiResponse<string>("Không tìm thấy hội thoại!"));

            var messages = await _context.ChatMessages
                .Where(m => m.SessionId == sessionId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new ChatMessageDto
                {
                    Id = m.Id,
                    Role = m.Role,
                    Content = m.Content,
                    CreatedAt = m.CreatedAt
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<ChatMessageDto>>(messages, "Lấy tin nhắn thành công!"));
        }

        // ============ SEND MESSAGE (đã thêm khả năng tạo Task/Event đồng bộ) ============

        [HttpPost("sessions/{sessionId}/messages")]
        public async Task<IActionResult> SendMessage(Guid sessionId, [FromBody] SendMessageDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Content))
                return BadRequest(new ApiResponse<string>("Nội dung tin nhắn không được để trống!"));

            var userId = GetUserId();
            var session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound(new ApiResponse<string>("Không tìm thấy hội thoại!"));

            var recentMessages = await _context.ChatMessages
                .Where(m => m.SessionId == sessionId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(20)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            var userDataContext = await BuildUserDataContextAsync(userId);
            var vnNow = GetVietnamNow();

            var (systemPrompt, userPrompt) = BuildPromptParts(recentMessages, request.Content, userDataContext, vnNow);

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

            var newTasks = new List<Assistant.Models.Task>();
            var newEvents = new List<CalendarEvent>();
            var conflictNotes = new List<string>();
            var localRanges = new List<(DateTime Start, DateTime End, string Title)>();

            bool OverlapsLocal(DateTime s, DateTime e, out string withTitle)
            {
                foreach (var r in localRanges)
                {
                    if (s < r.End && e > r.Start) { withTitle = r.Title; return true; }
                }
                withTitle = "";
                return false;
            }

            // Xử lý action loại "event" TRƯỚC — mỗi event luôn tạo kèm 1 Task liên kết
            var eventActionTitles = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var action in actions.Where(a => string.Equals(a.Type, "event", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    var evt = BuildEventFromAction(action, userId);
                    if (evt == null) continue;

                    var dbConflicts = await _conflict.FindConflictsAsync(userId, evt.StartTime, evt.EndTime);
                    var hasLocalConflict = OverlapsLocal(evt.StartTime, evt.EndTime, out var localTitle);
                    if (dbConflicts.Count > 0 || hasLocalConflict)
                    {
                        var withWhat = dbConflicts.Count > 0 ? string.Join(", ", dbConflicts.Select(c => c.Title)) : localTitle;
                        conflictNotes.Add($"⚠️ \"{evt.Title}\" ({evt.StartTime:HH:mm dd/MM}) trùng giờ với \"{withWhat}\" — mình vẫn tạo, bạn kiểm tra lại giúp nhé.");
                    }

                    var linkedTask = new Assistant.Models.Task
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Title = evt.Title,
                        Description = evt.Description,
                        DueDate = evt.StartTime,
                        Priority = MapTaskPriority(action.Priority),
                        Status = "pending",
                        InputMethod = "ai_chat",
                        EstimatedMinutes = null,
                        CreatedAt = evt.CreatedAt,
                        CompletedAt = null,
                        LinkedEventId = evt.Id
                    };
                    evt.LinkedTaskId = linkedTask.Id;

                    newEvents.Add(evt);
                    newTasks.Add(linkedTask);
                    localRanges.Add((evt.StartTime, evt.EndTime, evt.Title));
                    eventActionTitles.Add(action.Title.Trim());
                }
                catch
                {
                    // Bỏ qua action lỗi
                }
            }

            // Xử lý action loại "task" — bỏ qua nếu trùng title với event action vừa xử lý
            foreach (var action in actions.Where(a => string.Equals(a.Type, "task", StringComparison.OrdinalIgnoreCase)))
            {
                try
                {
                    if (eventActionTitles.Contains(action.Title?.Trim() ?? "")) continue;

                    var task = BuildTaskFromAction(action, userId);
                    if (task == null) continue;

                    if (task.DueDate.HasValue)
                    {
                        var start = task.DueDate.Value;
                        var end = start.AddMinutes(30);

                        var dbConflicts = await _conflict.FindConflictsAsync(userId, start, end);
                        var hasLocalConflict = OverlapsLocal(start, end, out var localTitle);
                        if (dbConflicts.Count > 0 || hasLocalConflict)
                        {
                            var withWhat = dbConflicts.Count > 0 ? string.Join(", ", dbConflicts.Select(c => c.Title)) : localTitle;
                            conflictNotes.Add($"⚠️ \"{task.Title}\" ({start:HH:mm dd/MM}) trùng giờ với \"{withWhat}\" — mình vẫn tạo, bạn kiểm tra lại giúp nhé.");
                        }

                        localRanges.Add((start, end, task.Title));
                    }

                    newTasks.Add(task);
                }
                catch
                {
                    // Bỏ qua action lỗi
                }
            }

            if (conflictNotes.Count > 0)
                aiReply += "\n\n" + string.Join("\n", conflictNotes);

            var now = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);

            var userMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                Role = "user",
                Content = request.Content,
                CreatedAt = now
            };

            var aiMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                Role = "assistant",
                Content = aiReply,
                CreatedAt = now.AddMilliseconds(1)
            };

            _context.ChatMessages.AddRange(userMessage, aiMessage);

            if (newTasks.Count > 0)
                _context.Tasks.AddRange(newTasks);

            if (newEvents.Count > 0)
                _context.CalendarEvents.AddRange(newEvents);

            if (string.IsNullOrWhiteSpace(session.Title))
            {
                session.Title = request.Content.Length > 50
                    ? request.Content.Substring(0, 50) + "..."
                    : request.Content;
            }
            session.LastActivity = now;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi lưu tin nhắn: {ex.Message}"));
            }

            return Ok(new ApiResponse<ChatMessageDto>(new ChatMessageDto
            {
                Id = aiMessage.Id,
                Role = aiMessage.Role,
                Content = aiMessage.Content,
                CreatedAt = aiMessage.CreatedAt,
                CreatedTaskCount = newTasks.Count,
                CreatedEventCount = newEvents.Count
            }, "AI đã phản hồi!"));
        }

        [HttpDelete("sessions/{sessionId}")]
        public async Task<IActionResult> DeleteSession(Guid sessionId)
        {
            var userId = GetUserId();
            var session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound(new ApiResponse<string>("Không tìm thấy hội thoại!"));

            _context.ChatSessions.Remove(session);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>("Đã xóa hội thoại!"));
        }

        [HttpDelete("sessions/{sessionId}/messages/{messageId}")]
        public async Task<IActionResult> DeleteMessage(Guid sessionId, Guid messageId)
        {
            var userId = GetUserId();
            var session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound(new ApiResponse<string>("Không tìm thấy hội thoại!"));

            var message = await _context.ChatMessages
                .FirstOrDefaultAsync(m => m.Id == messageId && m.SessionId == sessionId);

            if (message == null)
                return NotFound(new ApiResponse<string>("Không tìm thấy tin nhắn!"));

            _context.ChatMessages.Remove(message);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>("Đã xóa tin nhắn!"));
        }

        // ============ HELPER: BUILD CONTEXT DỮ LIỆU USER ============

        private async Task<string> BuildUserDataContextAsync(Guid userId)
        {
            var vnNow = GetVietnamNow();
            var todayStart = vnNow.Date;
            var todayEnd = todayStart.AddDays(1);
            var weekEnd = todayStart.AddDays(7);

            var tasks = await _context.Tasks
                .Where(t => t.UserId == userId && t.Status != "done")
                .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
                .ThenByDescending(t => t.Priority)
                .Take(30)
                .ToListAsync();

            var events = await _context.CalendarEvents
                .Where(e => e.UserId == userId && e.StartTime >= todayStart && e.StartTime <= weekEnd)
                .OrderBy(e => e.StartTime)
                .Take(30)
                .ToListAsync();

            var memories = await _context.UserMemories
                .Where(m => m.UserId == userId)
                .OrderByDescending(m => m.UpdatedAt)
                .Take(30)
                .ToListAsync();

            if (tasks.Count == 0 && events.Count == 0 && memories.Count == 0)
                return string.Empty;

            var sb = new StringBuilder();
            sb.AppendLine("=== DỮ LIỆU THỰC TẾ CỦA NGƯỜI DÙNG (chỉ dùng để trả lời, KHÔNG bịa thêm, KHÔNG bỏ sót mục nào) ===");
            sb.AppendLine($"Hôm nay là: {vnNow:dd/MM/yyyy} ({GetVietnameseDayOfWeek(vnNow.DayOfWeek)}), giờ hiện tại: {vnNow:HH:mm}");

            var tasksToday = tasks.Where(t => t.DueDate.HasValue && t.DueDate.Value >= todayStart && t.DueDate.Value < todayEnd).ToList();
            if (tasksToday.Count > 0)
            {
                sb.AppendLine($"\n-- CÔNG VIỆC CỦA HÔM NAY ({tasksToday.Count} việc, liệt kê ĐẦY ĐỦ khi được hỏi) --");
                foreach (var t in tasksToday)
                    sb.AppendLine($"- \"{t.Title}\" | Giờ: {t.DueDate:HH:mm} | Ưu tiên: {GetTaskPriorityLabel(t.Priority)} | Trạng thái: {t.Status}");
            }
            else
            {
                sb.AppendLine("\n-- CÔNG VIỆC CỦA HÔM NAY: không có việc nào có hạn hôm nay --");
            }

            if (tasks.Count > 0)
            {
                sb.AppendLine("\n-- Toàn bộ công việc (task) chưa hoàn thành (mọi thời điểm) --");
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
                sb.AppendLine("\n-- Thông tin đã ghi nhớ về người dùng --");
                foreach (var m in memories)
                {
                    if (m.Category == "Survey" && MemoryController.SurveyKeys.TryGetValue(m.Key, out var label))
                        sb.AppendLine($"- {label}: {m.Value}");
                    else
                        sb.AppendLine($"- {m.Category}/{m.Key}: {m.Value}");
                }
            }

            sb.AppendLine("=== HẾT DỮ LIỆU ===\n");
            return sb.ToString();
        }

        private static DateTime GetVietnamNow()
        {
            try
            {
                var tz = TimeZoneInfo.FindSystemTimeZoneById(
                    OperatingSystem.IsWindows() ? "SE Asia Standard Time" : "Asia/Ho_Chi_Minh");
                return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, tz);
            }
            catch
            {
                return DateTime.UtcNow.AddHours(7);
            }
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

        // ============ HELPER: PROMPT YÊU CẦU AI TRẢ JSON (reply + actions) ============

        private (string systemPrompt, string userPrompt) BuildPromptParts(List<ChatMessage> history, string newMessage, string? userDataContext, DateTime vnNow)
        {
            var sys = new StringBuilder();
            sys.AppendLine("Bạn là trợ lý AI cá nhân, trò chuyện bằng tiếng Việt tự nhiên.");
            sys.AppendLine("Ngoài trả lời bình thường, bạn có thể NHẬN DIỆN khi người dùng muốn:");
            sys.AppendLine("Khi người dùng hỏi về danh sách công việc/lịch trình, PHẢI liệt kê ĐẦY ĐỦ tất cả các mục có trong dữ liệu, tuyệt đối KHÔNG được tóm tắt, rút gọn hay bỏ sót bất kỳ mục nào.");
            sys.AppendLine("- Thêm một CÔNG VIỆC cần làm (task), HOẶC");
            sys.AppendLine("- Thêm một SỰ KIỆN vào lịch (event), HOẶC cả hai.");
            sys.AppendLine("Nếu câu hỏi cần thông tin real-time (thời tiết, tin tức, giá cả...), hãy dùng tool trước khi trả lời.");
            sys.AppendLine("CHÚ Ý QUAN TRỌNG: Tool DUY NHẤT bạn được phép gọi là 'web_search'. Việc tạo CÔNG VIỆC (task) hay SỰ KIỆN (event) KHÔNG phải là tool call — đó chỉ là dữ liệu bạn điền vào trường \"actions\" trong JSON trả lời cuối cùng. TUYỆT ĐỐI KHÔNG được gọi bất kỳ hàm/tool nào tên 'create_task', 'create_event', hay tương tự — những hàm đó không tồn tại.");
            sys.AppendLine("QUAN TRỌNG: câu trả lời CUỐI CÙNG (sau khi đã có đủ thông tin) phải là JSON DUY NHẤT, không markdown, đúng cấu trúc:");
            sys.AppendLine(@"{
  ""reply"": ""câu trả lời tự nhiên"",
  ""actions"": [ { ""type"": ""task hoặc event"", ""title"": ""..."", ""date"": ""yyyy-MM-dd"", ""time"": ""HH:mm hoặc null"", ""endTime"": ""HH:mm hoặc null"", ""isAllDay"": false, ""priority"": ""urgent|normal|low"", ""location"": ""... hoặc null"" } ]
}");
            sys.AppendLine("Nếu không có ý định thêm task/lịch, trả \"actions\": [].");
            sys.AppendLine($"Hôm nay là {vnNow:dd/MM/yyyy} ({GetVietnameseDayOfWeek(vnNow.DayOfWeek)}), giờ hiện tại {vnNow:HH:mm}.");

            if (!string.IsNullOrEmpty(userDataContext))
                sys.AppendLine(userDataContext);

            var usr = new StringBuilder();
            if (history.Count > 0)
            {
                usr.AppendLine("Lịch sử hội thoại gần đây:");
                foreach (var msg in history)
                    usr.AppendLine($"{(msg.Role == "user" ? "Người dùng" : "Trợ lý")}: {msg.Content}");
                usr.AppendLine();
            }
            usr.AppendLine($"Người dùng: {newMessage}");

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
            if (parsed != null)
                return (parsed.Reply, parsed.Actions ?? new List<AiAction>());

            var firstBrace = cleaned.IndexOf('{');
            var lastBrace = cleaned.LastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace)
            {
                var jsonSlice = cleaned[firstBrace..(lastBrace + 1)];
                parsed = TryParseAction(jsonSlice);
                if (parsed != null)
                    return (parsed.Reply, parsed.Actions ?? new List<AiAction>());
            }

            return (raw, new List<AiAction>());
        }

        private AiActionResponse? TryParseAction(string text)
        {
            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var parsed = JsonSerializer.Deserialize<AiActionResponse>(text, options);
                if (parsed != null && !string.IsNullOrWhiteSpace(parsed.Reply))
                    return parsed;
            }
            catch
            {
            }
            return null;
        }

        private static DateTime? ParseDateTimeVn(string? date, string? time, bool isAllDay)
        {
            if (string.IsNullOrWhiteSpace(date)) return null;
            if (!DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out var d))
                return null;

            if (isAllDay || string.IsNullOrWhiteSpace(time))
                return d.Date;

            if (TimeSpan.TryParse(time, out var t))
                return d.Date.Add(t);

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

        private Assistant.Models.Task? BuildTaskFromAction(AiAction action, Guid userId)
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
                InputMethod = "ai_chat",
                EstimatedMinutes = null,
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc),
                CompletedAt = null
            };
        }

        private CalendarEvent? BuildEventFromAction(AiAction action, Guid userId)
        {
            if (string.IsNullOrWhiteSpace(action.Title)) return null;

            var start = ParseDateTimeVn(action.Date, action.Time, action.IsAllDay);
            if (start == null) return null;

            DateTime end;
            if (action.IsAllDay)
            {
                end = start.Value.Date;
            }
            else if (!string.IsNullOrWhiteSpace(action.EndTime))
            {
                end = ParseDateTimeVn(action.Date, action.EndTime, false) ?? start.Value.AddHours(1);
            }
            else
            {
                end = start.Value.AddHours(1);
            }

            if (end <= start.Value)
                end = start.Value.AddHours(1);

            return new CalendarEvent
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = action.Title.Trim(),
                Description = null,
                StartTime = start.Value,
                EndTime = end,
                Location = action.Location,
                Source = "ai_chat",
                ExternalId = null,
                IsAllDay = action.IsAllDay,
                Priority = MapEventPriority(action.Priority),
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc)
            };
        }
    }

    // ===== DTOs =====
    public class ChatSessionDto
    {
        public Guid Id { get; set; }
        public string? Title { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime LastActivity { get; set; }
    }

    public class ChatMessageDto
    {
        public Guid Id { get; set; }
        public string Role { get; set; } = null!;
        public string Content { get; set; } = null!;
        public DateTime CreatedAt { get; set; }
        public int CreatedTaskCount { get; set; }
        public int CreatedEventCount { get; set; }
    }

    public class SendMessageDto
    {
        public string Content { get; set; } = null!;
    }

    public class AiActionResponse
    {
        public string Reply { get; set; } = string.Empty;
        public List<AiAction>? Actions { get; set; }
    }

    public class AiAction
    {
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Date { get; set; }
        public string? Time { get; set; }
        public string? EndTime { get; set; }
        public bool IsAllDay { get; set; }
        public string Priority { get; set; } = "normal";
        public string? Location { get; set; }
    }
}