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

        public ChatController(AppDbContext context, GroqService groqService)
        {
            _context = context;
            _groqService = groqService;
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

        // ============ SEND MESSAGE (đã thêm khả năng tạo Task/Event) ============

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

            // 1. Lấy lịch sử TRƯỚC — lúc này chưa có tin nhắn mới
            var recentMessages = await _context.ChatMessages
                .Where(m => m.SessionId == sessionId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(20)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync();

            // 2. Nạp context dữ liệu user (task, lịch, ghi nhớ)
            var userDataContext = await BuildUserDataContextAsync(userId);
            var vnNow = GetVietnamNow();

            // 3. Build prompt yêu cầu AI trả JSON gồm reply + actions (task/event)
            var prompt = BuildPromptWithAction(recentMessages, request.Content, userDataContext, vnNow);

            // 4. Gọi AI TRƯỚC — nếu lỗi thì KHÔNG đụng gì tới DB
            string rawAiResponse;
            try
            {
                rawAiResponse = await _groqService.ChatAsync(prompt);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi gọi AI: {ex.Message}"));
            }

            // 5. Parse JSON trả về: lấy câu trả lời + danh sách hành động (nếu có)
            var (aiReply, actions) = ParseAiActionResponse(rawAiResponse);

            var newTasks = new List<Assistant.Models.Task>();
            var newEvents = new List<CalendarEvent>();

            foreach (var action in actions)
            {
                try
                {
                    if (string.Equals(action.Type, "task", StringComparison.OrdinalIgnoreCase))
                    {
                        var task = BuildTaskFromAction(action, userId);
                        if (task != null) newTasks.Add(task);
                    }
                    else if (string.Equals(action.Type, "event", StringComparison.OrdinalIgnoreCase))
                    {
                        var evt = BuildEventFromAction(action, userId);
                        if (evt != null) newEvents.Add(evt);
                    }
                }
                catch
                {
                    // Bỏ qua action lỗi (thiếu dữ liệu, sai định dạng...) — không làm hỏng phản hồi chat
                }
            }

            // 6. Lưu tin nhắn + task/event mới cùng lúc
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
                sb.AppendLine("\n-- Thông tin đã ghi nhớ về người dùng --");
                foreach (var m in memories)
                {
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

        // ============ HELPER MỚI: PROMPT YÊU CẦU AI TRẢ JSON (reply + actions) ============

        private string BuildPromptWithAction(List<ChatMessage> history, string newMessage, string? userDataContext, DateTime vnNow)
        {
            var sb = new StringBuilder();

            sb.AppendLine("Bạn là trợ lý AI cá nhân, trò chuyện bằng tiếng Việt tự nhiên.");
            sb.AppendLine("Ngoài trả lời bình thường, bạn có thể NHẬN DIỆN khi người dùng muốn:");
            sb.AppendLine("- Thêm một CÔNG VIỆC cần làm (task), HOẶC");
            sb.AppendLine("- Thêm một SỰ KIỆN vào lịch (event), HOẶC");
            sb.AppendLine("- Cả hai cùng lúc.");
            sb.AppendLine("Ví dụ: \"tôi họp lúc 2h chiều nay\" => tạo 1 event \"Họp\" lúc 14:00 hôm nay.");
            sb.AppendLine("Ví dụ: \"nhắc tôi nộp báo cáo trước thứ 6\" => tạo 1 task \"Nộp báo cáo\", hạn là thứ 6 tuần này.");
            sb.AppendLine();
            sb.AppendLine("QUAN TRỌNG: CHỈ trả lời bằng một JSON hợp lệ DUY NHẤT, không thêm chữ nào khác, không dùng markdown code fence (```), đúng cấu trúc sau:");
            sb.AppendLine(@"{
  ""reply"": ""câu trả lời tự nhiên bằng tiếng Việt cho người dùng, xác nhận rõ nếu đã thêm task/lịch"",
  ""actions"": [
    {
      ""type"": ""task hoặc event"",
      ""title"": ""tiêu đề ngắn gọn"",
      ""date"": ""yyyy-MM-dd"",
      ""time"": ""HH:mm hoặc null"",
      ""endTime"": ""HH:mm hoặc null (chỉ dùng cho event, nếu không rõ thì lấy time cộng 1 giờ)"",
      ""isAllDay"": false,
      ""priority"": ""urgent | normal | low"",
      ""location"": ""địa điểm hoặc null""
    }
  ]
}");
            sb.AppendLine("Nếu người dùng KHÔNG có ý định thêm task/lịch, trả về \"actions\": [].");
            sb.AppendLine($"Hôm nay là {vnNow:dd/MM/yyyy} ({GetVietnameseDayOfWeek(vnNow.DayOfWeek)}), giờ hiện tại {vnNow:HH:mm}. Hãy tính ngày cụ thể (yyyy-MM-dd) dựa trên mốc này khi người dùng nói \"hôm nay\", \"ngày mai\", \"thứ 6 tuần này\"...");
            sb.AppendLine();

            if (!string.IsNullOrEmpty(userDataContext))
            {
                sb.AppendLine(userDataContext);
            }

            if (history.Count > 0)
            {
                sb.AppendLine("Lịch sử hội thoại gần đây:");
                foreach (var msg in history)
                {
                    var roleLabel = msg.Role == "user" ? "Người dùng" : "Trợ lý";
                    sb.AppendLine($"{roleLabel}: {msg.Content}");
                }
                sb.AppendLine();
            }

            sb.AppendLine($"Người dùng: {newMessage}");
            sb.AppendLine("Trợ lý (chỉ JSON):");

            return sb.ToString();
        }

        private (string reply, List<AiAction> actions) ParseAiActionResponse(string raw)
        {
            var cleaned = raw.Trim();

            // Lỡ AI vẫn bọc ```json ... ``` thì bóc ra
            if (cleaned.StartsWith("```"))
            {
                var firstNewline = cleaned.IndexOf('\n');
                if (firstNewline >= 0) cleaned = cleaned[(firstNewline + 1)..];
                var lastFence = cleaned.LastIndexOf("```");
                if (lastFence >= 0) cleaned = cleaned[..lastFence];
                cleaned = cleaned.Trim();
            }

            try
            {
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var parsed = JsonSerializer.Deserialize<AiActionResponse>(cleaned, options);
                if (parsed != null && !string.IsNullOrWhiteSpace(parsed.Reply))
                {
                    return (parsed.Reply, parsed.Actions ?? new List<AiAction>());
                }
            }
            catch
            {
                // AI không trả JSON hợp lệ -> coi toàn bộ nội dung là câu trả lời thường
            }

            return (raw, new List<AiAction>());
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
                InputMethod = "ai_chat",   // bắt buộc, không null
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

            // Đảm bảo EndTime luôn sau StartTime (tránh lỗi logic nếu AI đưa giờ kết thúc sai)
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
                Source = "ai_chat",       // bắt buộc, không null
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

    // ===== DTO cho JSON mà AI trả về =====
    public class AiActionResponse
    {
        public string Reply { get; set; } = string.Empty;
        public List<AiAction>? Actions { get; set; }
    }

    public class AiAction
    {
        public string Type { get; set; } = string.Empty;      // "task" | "event"
        public string Title { get; set; } = string.Empty;
        public string? Date { get; set; }                     // "yyyy-MM-dd"
        public string? Time { get; set; }                      // "HH:mm"
        public string? EndTime { get; set; }                   // "HH:mm" (event)
        public bool IsAllDay { get; set; }
        public string Priority { get; set; } = "normal";       // urgent | normal | low
        public string? Location { get; set; }
    }
}