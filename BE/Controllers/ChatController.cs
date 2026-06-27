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

        // GET /api/chat/sessions — danh sách các đoạn chat của user, mới nhất lên đầu
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

        // POST /api/chat/sessions — tạo session mới (bấm "New Chat")
        [HttpPost("sessions")]
        public async Task<IActionResult> CreateSession()
        {
            var userId = GetUserId();
            var session = new ChatSession
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Title = null, // sẽ tự đặt theo câu hỏi đầu tiên
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

        // GET /api/chat/sessions/{sessionId}/messages — lấy toàn bộ tin nhắn trong 1 session
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

        // POST /api/chat/sessions/{sessionId}/messages
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

            // 2. Lưu tin nhắn user SAU KHI đã lấy lịch sử
            var userMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                Role = "user",
                Content = request.Content,
                CreatedAt = DateTime.UtcNow
            };
            _context.ChatMessages.Add(userMessage);

            if (string.IsNullOrWhiteSpace(session.Title))
            {
                session.Title = request.Content.Length > 50
                    ? request.Content.Substring(0, 50) + "..."
                    : request.Content;
            }
            session.LastActivity = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // 3. Build prompt với lịch sử cũ + câu hỏi mới
            var prompt = BuildPrompt(recentMessages, request.Content);

            string aiReply;
            try
            {
                aiReply = await _groqService.ChatAsync(prompt);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi gọi AI: {ex.Message}"));
            }

            // 4. Lưu tin nhắn AI
            var aiMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                Role = "assistant",
                Content = aiReply,
                CreatedAt = DateTime.UtcNow
            };
            _context.ChatMessages.Add(aiMessage);
            session.LastActivity = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<ChatMessageDto>(new ChatMessageDto
            {
                Id = aiMessage.Id,
                Role = aiMessage.Role,
                Content = aiMessage.Content,
                CreatedAt = aiMessage.CreatedAt
            }, "AI đã phản hồi!"));
        }

        // DELETE /api/chat/sessions/{sessionId} — xóa 1 đoạn chat
        [HttpDelete("sessions/{sessionId}")]
        public async Task<IActionResult> DeleteSession(Guid sessionId)
        {
            var userId = GetUserId();
            var session = await _context.ChatSessions
                .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId);

            if (session == null)
                return NotFound(new ApiResponse<string>("Không tìm thấy hội thoại!"));

            _context.ChatSessions.Remove(session); // cascade sẽ xóa luôn ChatMessages liên quan (nếu config đúng)
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>("Đã xóa hội thoại!"));
        }

        // DELETE /api/chat/sessions/{sessionId}/messages/{messageId}
        [HttpDelete("sessions/{sessionId}/messages/{messageId}")]
        [Route("api/chat/sessions/{sessionId}/messages/{messageId}")]
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

        // Helper: build prompt kết hợp UserMemory + lịch sử chat + câu hỏi mới
        private string BuildPrompt(List<ChatMessage> history, string newMessage)
        {
            var sb = new StringBuilder();

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