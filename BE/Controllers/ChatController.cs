using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text;
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
                CreatedAt = DateTime.UtcNow,
                LastActivity = DateTime.UtcNow
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

        // ============ SEND MESSAGE (đã sửa) ============

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

            // 2. Nếu đây là tin nhắn ĐẦU TIÊN của session → nạp context dữ liệu user
            //    (task, lịch, ghi nhớ) để AI trả lời được câu như "hôm nay tôi có việc gì"
            string? userDataContext = null;
            if (recentMessages.Count == 0)
            {
                userDataContext = await BuildUserDataContextAsync(userId);
            }

            // 3. Build prompt (context + lịch sử + câu hỏi mới)
            var prompt = BuildPrompt(recentMessages, request.Content, userDataContext);

            // 4. Gọi AI TRƯỚC — nếu lỗi thì KHÔNG đụng gì tới DB
            string aiReply;
            try
            {
                aiReply = await _groqService.ChatAsync(prompt);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi gọi AI: {ex.Message}"));
            }

            // 5. AI trả lời thành công → lưu cả 2 tin nhắn cùng lúc
            var now = DateTime.UtcNow;

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
                CreatedAt = aiMessage.CreatedAt
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

        /// <summary>
        /// Đọc Task chưa hoàn thành, CalendarEvent trong 7 ngày tới, và UserMemory
        /// để AI có ngữ cảnh trả lời các câu hỏi như "hôm nay tôi có việc gì".
        /// </summary>
        private async Task<string> BuildUserDataContextAsync(Guid userId)
        {
            // Dữ liệu StartTime/DueDate đang được lưu dạng "giờ VN không kèm timezone"
            // (bug đã biết trong dự án), nên ta so sánh bằng giờ VN thay vì UTC.
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
                return DateTime.UtcNow.AddHours(7); // fallback nếu không tìm thấy timezone trên OS
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

        // Helper: build prompt kết hợp Context dữ liệu (nếu có) + lịch sử chat + câu hỏi mới
        private string BuildPrompt(List<ChatMessage> history, string newMessage, string? userDataContext = null)
        {
            var sb = new StringBuilder();

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
            sb.AppendLine("Trợ lý:");

            return sb.ToString();
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
    }

    public class SendMessageDto
    {
        public string Content { get; set; } = null!;
    }
}