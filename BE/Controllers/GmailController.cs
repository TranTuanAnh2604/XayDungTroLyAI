using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using System.Text.Json;
using Assistant.Models;
using Assistant.Services;
using Assistant.Wrappers;
using Assistant.DTOs; // dùng DTO từ đây, xóa class trùng bên dưới

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
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

        // 1. LIÊN KẾT GMAIL
        [HttpPost("connect")]
        public async Task<IActionResult> ConnectGmail([FromBody] ConnectGoogleDto request)
        {
            if (string.IsNullOrWhiteSpace(request.GoogleRefreshToken))
                return BadRequest(new ApiResponse<string>("Thiếu Google Refresh Token!"));

            var userId = GetUserId();

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

        // 2. LẤY DANH SÁCH GMAIL (inbox) — đặt TRONG class
        [HttpGet("inbox")]
        public async Task<IActionResult> GetInbox([FromQuery] int maxResults = 10)
        {
            var userId = GetUserId();

            var googleTokenMemory = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == "OAuth" && m.Key == "Google_RefreshToken");

            if (googleTokenMemory == null)
                return BadRequest(new ApiResponse<string>("Chưa liên kết Gmail!"));

            try
            {
                var accessToken = await _gmailService.GetNewAccessTokenAsync(googleTokenMemory.Value);
                var gmails = await _gmailService.GetInboxGmailsAsync(accessToken, maxResults);
                return Ok(new ApiResponse<List<Assistant.DTOs.GmailDto>>(gmails, "Thành công"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi: {ex.Message}"));
            }
        }

        // 3. LẤY CHI TIẾT 1 GMAIL — đặt TRONG class
        [HttpGet("inbox/{messageId}")]
        public async Task<IActionResult> GetGmailDetail(string messageId)
        {
            var userId = GetUserId();

            var googleTokenMemory = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == "OAuth" && m.Key == "Google_RefreshToken");

            if (googleTokenMemory == null)
                return BadRequest(new ApiResponse<string>("Chưa liên kết Gmail!"));

            try
            {
                var accessToken = await _gmailService.GetNewAccessTokenAsync(googleTokenMemory.Value);
                var gmail = await _gmailService.GetGmailDetailAsync(accessToken, messageId);
                return Ok(new ApiResponse<Assistant.DTOs.GmailDetailDto>(gmail, "Thành công"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi: {ex.Message}"));
            }
        }

        // 4. AUTO SYNC
        [HttpPost("auto-sync")]
        public async Task<IActionResult> AutoSync()
        {
            var userId = GetUserId();
            var today = DateTime.Now;

            var googleTokenMemory = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == "OAuth" && m.Key == "Google_RefreshToken");

            if (googleTokenMemory == null)
                return Ok(new ApiResponse<string>("Chưa liên kết Gmail. Không cần đồng bộ."));

            try
            {
                var accessToken = await _gmailService.GetNewAccessTokenAsync(googleTokenMemory.Value);
                var gmails = await _gmailService.GetRecentGmailsAsync(accessToken);

                if (!gmails.Any())
                    return Ok(new ApiResponse<string>("Không có gmail mới trong 24h qua."));

                int addedTasks = 0;
                foreach (var gmail in gmails)
                {
                    var prompt = $@"
Thời gian hiện tại của hệ thống: {today:dd/MM/yyyy HH:mm}
Nhiệm vụ: Đọc đoạn tóm tắt Gmail sau và trích xuất xem có lịch hẹn, deadline, lịch thi, hay công việc cụ thể nào không.
- Priority: Đánh giá độ ưu tiên (1: Thấp, 2: Trung bình, 3: Cao, 4: Khẩn cấp).
- DueDate: Định dạng chuẩn ISO ""yyyy-MM-ddTHH:mm:ss"". Nếu gmail chỉ nói ngày (ví dụ: ngày mai, thứ hai tuần sau) mà không nói giờ, hãy tự định dạng về lúc 08:00:00 của ngày đó.

Gmail nội dung: ""{gmail}""

RÀO CẢN BẢO MẬT:
- Nếu nội dung gmail KHÔNG chứa bất kỳ lịch trình, deadline hay việc cần làm nào, bắt buộc trả về duy nhất cặp dấu ngoặc nhọn rỗng: {{}}
- Nếu CÓ, trả về duy nhất chuỗi JSON theo định dạng bắt buộc dưới đây, KHÔNG giải thích dông dài, KHÔNG chào hỏi.

Định dạng bắt buộc:
{{
  ""Title"": ""Tên công việc ngắn gọn từ Gmail"",
  ""Priority"": 2,
  ""DueDate"": ""2026-05-26T08:00:00""
}}
";
                    var aiResult = await _aiService.ChatAsync(prompt);
                    var cleanedJson = CleanJsonString(aiResult);

                    if (cleanedJson != "{}")
                    {
                        try
                        {
                            var extractedTask = JsonSerializer.Deserialize<ExtractedGmailTaskDto>(cleanedJson);

                            if (extractedTask != null && !string.IsNullOrEmpty(extractedTask.Title))
                            {
                                _context.Tasks.Add(new Assistant.Models.Task
                                {
                                    Id = Guid.NewGuid(),
                                    UserId = userId,
                                    Title = $"[Gmail] {extractedTask.Title}",
                                    Description = "Tự động trích xuất từ hòm thư điện tử",
                                    Status = "pending",
                                    Priority = (byte)(extractedTask.Priority >= 1 && extractedTask.Priority <= 4 ? extractedTask.Priority : 2),
                                    DueDate = extractedTask.DueDate ?? today.AddDays(1),
                                    InputMethod = "ai",
                                    CreatedAt = DateTime.UtcNow
                                });
                                addedTasks++;
                            }
                        }
                        catch (JsonException) { continue; }
                    }
                }

                if (addedTasks > 0) await _context.SaveChangesAsync();

                return Ok(new ApiResponse<string>($"Đồng bộ hoàn tất! AI đã thêm {addedTasks} công việc mới."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi khi đồng bộ Gmail: {ex.Message}"));
            }
        }

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

    // Các DTO nội bộ — KHÔNG trùng với Assistant.DTOs
    public class ConnectGoogleDto
    {
        public string GoogleRefreshToken { get; set; } = null!;
    }

    public class ExtractedGmailTaskDto
    {
        public string Title { get; set; } = null!;
        public int Priority { get; set; }
        public DateTime? DueDate { get; set; }
    }
}