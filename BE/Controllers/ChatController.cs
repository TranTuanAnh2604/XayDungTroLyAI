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

        // POST /api/chat/sessions/{sessionId}/messages — gửi tin nhắn, nhận phản hồi AI
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

            // 1. Lưu tin nhắn của user
            var userMessage = new ChatMessage
            {
                Id = Guid.NewGuid(),
                SessionId = sessionId,
                Role = "user",
                Content = request.Content,
                CreatedAt = DateTime.UtcNow
            };
            _context.ChatMessages.Add(userMessage);

            // Nếu session chưa có title, lấy 50 ký tự đầu của câu hỏi đầu tiên làm title
            if (string.IsNullOrWhiteSpace(session.Title))
            {
                session.Title = request.Content.Length > 50
                    ? request.Content.Substring(0, 50) + "..."
                    : request.Content;
            }
            session.LastActivity = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // 2. Lấy lịch sử gần nhất trong session (tối đa 20 tin nhắn gần nhất) để AI có ngữ cảnh
            var recentMessages = await _context.ChatMessages
                .Where(m => m.SessionId == sessionId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(20)
                .OrderBy(m => m.CreatedAt) // đảo lại đúng thứ tự thời gian
                .ToListAsync();

            // 3. Lấy UserMemory để cá nhân hóa
            var memories = await _context.UserMemories
                .Where(m => m.UserId == userId)
                .ToListAsync();

            // 4. Build prompt tổng hợp gửi cho Groq
            var prompt = BuildPrompt(memories, recentMessages, request.Content);

            string aiReply;
            try
            {
                aiReply = await _groqService.ChatAsync(prompt);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi gọi AI: {ex.Message}"));
            }

            // 5. Lưu tin nhắn phản hồi của AI
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

        // Helper: build prompt kết hợp UserMemory + lịch sử chat + câu hỏi mới
        private string BuildPrompt(List<UserMemory> memories, List<ChatMessage> history, string newMessage)
        {
            var sb = new StringBuilder();

            if (memories.Count > 0)
            {
                sb.AppendLine("Thông tin đã biết về người dùng (hãy dùng để cá nhân hóa câu trả lời, không lặp lại nguyên văn):");
                foreach (var m in memories)
                {
                    sb.AppendLine($"- [{m.Category}] {m.Key}: {m.Value}");
                }
                sb.AppendLine();
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