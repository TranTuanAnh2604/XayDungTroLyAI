using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using Assistant.Models;
using Assistant.Services;
using Assistant.Wrappers;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bắt buộc đăng nhập app mình
    public class GmailController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GmailService _gmailService;
        private readonly GroqService _aiService;

        public GmailController(AppDbContext context, GmailService gmailService, GroqService aiService)
        {
            _context = context;
            _gmailService = gmailService;
            _aiService = aiService;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // =========================================================================
        // 1. LIÊN KẾT GMAIL: FE gọi 1 lần duy nhất để cất chìa khóa Google
        // =========================================================================
        [HttpPost("connect")]
        public async Task<IActionResult> ConnectGmail([FromBody] ConnectGoogleDto request)
        {
            if (string.IsNullOrWhiteSpace(request.GoogleRefreshToken))
                return BadRequest(new ApiResponse<string>("Thiếu Google Refresh Token!"));

            var userId = GetUserId();

            // Lưu khéo léo vào bảng user_memories
            var existingToken = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == "OAuth" && m.Key == "Google_RefreshToken");

            if (existingToken != null)
            {
                existingToken.Value = request.GoogleRefreshToken;
                existingToken.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.UserMemories.Add(new UserMemory
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Category = "OAuth",
                    Key = "Google_RefreshToken",
                    Value = request.GoogleRefreshToken,
                    Source = "system",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new ApiResponse<string>("Đã liên kết Gmail thành công!", "Thành công"));
        }

        [HttpPost("auto-sync")]
        public async Task<IActionResult> AutoSync()
        {
            var userId = GetUserId();
            var today = DateTime.Now;

            // 1. Móc chìa khóa từ DB ra
            var googleTokenMemory = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == "OAuth" && m.Key == "Google_RefreshToken");

            if (googleTokenMemory == null)
                return Ok(new ApiResponse<string>("Chưa liên kết Gmail. Không cần đồng bộ."));

            try
            {
                // 2. Lên Google lấy Mail về
                var accessToken = await _gmailService.GetNewAccessTokenAsync(googleTokenMemory.Value);
                var emails = await _gmailService.GetRecentEmailsAsync(accessToken);

                if (!emails.Any())
                    return Ok(new ApiResponse<string>("Không có email mới trong 24h qua."));

                // 3. Đưa cho AI bóc tách (chỉ tìm lịch hẹn, deadline)
                int addedTasks = 0;
                foreach (var email in emails)
                {
                    var prompt = $@"
Thời gian hiện tại của hệ thống: {today:dd/MM/yyyy HH:mm}
Nhiệm vụ: Đọc đoạn tóm tắt Email sau và trích xuất xem có lịch hẹn, deadline, lịch thi, hay công việc cụ thể nào không.
- Priority: Đánh giá độ ưu tiên (1: Thấp, 2: Trung bình, 3: Cao, 4: Khẩn cấp).
- DueDate: Định dạng chuẩn ISO ""yyyy-MM-ddTHH:mm:ss"". Nếu email chỉ nói ngày (ví dụ: ngày mai, thứ hai tuần sau) mà không nói giờ, hãy tự định dạng về lúc 08:00:00 của ngày đó.

Email nội dung: ""{email}""

RÀO CẢN BẢO MẬT:
- Nếu nội dung email KHÔNG chứa bất kỳ lịch trình, deadline hay việc cần làm nào, bắt buộc trả về duy nhất cặp dấu ngoặc nhọn rỗng: {{}}
- Nếu CÓ, trả về duy nhất chuỗi JSON theo định dạng bắt buộc dưới đây, KHÔNG giải thích dông dài, KHÔNG chào hỏi.

Định dạng bắt buộc:
{{
  ""Title"": ""Tên công việc ngắn gọn từ Email"",
  ""Priority"": 2,
  ""DueDate"": ""2026-05-26T08:00:00""
}}
";

                    var aiResult = await _aiService.ChatAsync(prompt);
                    var cleanedJson = CleanJsonString(aiResult);

                    // Nếu AI thấy có việc (không phải ngoặc rỗng) thì tiến hành bóc tách lưu DB
                    if (cleanedJson != "{}")
                    {
                        try
                        {
                            var extractedTask = JsonSerializer.Deserialize<ExtractedEmailTaskDto>(cleanedJson);

                            if (extractedTask != null && !string.IsNullOrEmpty(extractedTask.Title))
                            {
                                // Tạo một Task mới ném vào bảng tasks của ông
                                _context.Tasks.Add(new Assistant.Models.Task
                                {
                                    Id = Guid.NewGuid(),
                                    UserId = userId,
                                    Title = $"[Gmail] {extractedTask.Title}", // Gắn tag [Gmail] để phân biệt
                                    Description = "Tự động trích xuất từ hòm thư điện tử",
                                    Status = "pending", // Theo chuẩn DB cũ của ông
                                    Priority = (byte)(extractedTask.Priority >= 1 && extractedTask.Priority <= 4 ? extractedTask.Priority : 2),
                                    DueDate = extractedTask.DueDate ?? today.AddDays(1),
                                    InputMethod = "ai", // Khớp với CHECK Constraint 'voice','text','ai' trong DB của ông
                                    CreatedAt = DateTime.UtcNow
                                });
                                addedTasks++;
                            }
                        }
                        catch (JsonException)
                        {
                            // Lỡ con AI nhả chuỗi lỗi thì bỏ qua mail này, chạy tiếp mail sau không để crash app
                            continue;
                        }
                    }
                }

                // Nếu có việc mới thì chốt hạ lưu xuống SQL Server
                if (addedTasks > 0)
                {
                    await _context.SaveChangesAsync();
                }

                return Ok(new ApiResponse<string>($"Đồng bộ hoàn tất! AI đã rà soát hòm thư và tự động thêm {addedTasks} công việc mới vào lịch lịch trình của bạn."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi khi đồng bộ Gmail: {ex.Message}"));
            }
        }

        // Hàm hỗ trợ làm sạch JSON giống bên AiController
        private string CleanJsonString(string jsonString)
        {
            if (string.IsNullOrWhiteSpace(jsonString)) return "{}";
            var cleaned = jsonString.Trim();
            if (cleaned.StartsWith("```json")) cleaned = cleaned.Substring(7);
            else if (cleaned.StartsWith("```")) cleaned = cleaned.Substring(3);
            if (cleaned.EndsWith("```")) cleaned = cleaned.Substring(0, cleaned.Length - 3);
            cleaned = cleaned.Trim();

            int firstBrace = cleaned.IndexOf('{');
            int lastBrace = cleaned.LastIndexOf('}');
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace)
                return cleaned.Substring(firstBrace, lastBrace - firstBrace + 1);

            return "{}";
        }
    }

    public class ConnectGoogleDto
    {
        public string GoogleRefreshToken { get; set; } = null!;
    }

    public class ExtractedEmailTaskDto
    {
        public string Title { get; set; } = null!;
        public int Priority { get; set; }
        public DateTime? DueDate { get; set; }
    }
}