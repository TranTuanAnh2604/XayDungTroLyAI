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
        private readonly ILogger<GmailController> _logger;

        public GmailController(AppDbContext context, GmailService gmailService, GroqService aiService, ILogger<GmailController> logger)
        {
            _context = context;
            _gmailService = gmailService;
            _aiService = aiService;
            _logger = logger;
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
                existingToken.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);
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
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc)
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new ApiResponse<string>("Đã liên kết Gmail thành công!", "Thành công"));
        }

        // 2. LẤY DANH SÁCH GMAIL (inbox) — đặt TRONG class
        [HttpGet("inbox")]
        public async Task<IActionResult> GetInbox([FromQuery] int maxResults = 15, [FromQuery] string category = "primary")
        {
            var userId = GetUserId();

            var googleTokenMemory = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == "OAuth" && m.Key == "Google_RefreshToken");

            if (googleTokenMemory == null)
                return BadRequest(new ApiResponse<string>("Chưa liên kết Gmail!"));

            try
            {
                var accessToken = await _gmailService.GetNewAccessTokenAsync(googleTokenMemory.Value);
                var gmails = await _gmailService.GetInboxGmailsAsync(accessToken, maxResults, category);
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
            var today = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);

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

                // Lấy danh sách email đã sync trước đó của user này
                var syncedIds = await _context.UserMemories
                    .Where(m => m.UserId == userId && m.Category == "SyncedGmail")
                    .Select(m => m.Key)
                    .ToListAsync();
                var syncedSet = new HashSet<string>(syncedIds);

                int addedTasks = 0;
                int skippedDuplicates = 0;

                foreach (var gmail in gmails)
                {
                    // Bỏ qua nếu email này đã được xử lý ở lần sync trước
                    if (syncedSet.Contains(gmail.Id))
                    {
                        skippedDuplicates++;
                        continue;
                    }

                    var prompt = $@"
Thời gian hiện tại của hệ thống: {today:dd/MM/yyyy HH:mm}
Nhiệm vụ: Đọc đoạn tóm tắt Gmail sau và trích xuất xem có lịch hẹn, deadline, lịch thi, hay công việc cụ thể nào không.
- Priority: Đánh giá độ ưu tiên (1: Thấp, 2: Trung bình, 3: Cao, 4: Khẩn cấp).
- DueDate: Định dạng chuẩn ISO ""yyyy-MM-ddTHH:mm:ss"". Nếu gmail chỉ nói ngày (ví dụ: ngày mai, thứ hai tuần sau) mà không nói giờ, hãy tự định dạng về lúc 08:00:00 của ngày đó.

Gmail nội dung: ""{gmail.Snippet}""

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
                    _logger.LogInformation("=== AI RAW RESPONSE cho gmail '{Gmail}': {Raw}", gmail.Snippet, aiResult);
                    var cleanedJson = CleanJsonString(aiResult);

                    // Đánh dấu email này đã được xử lý, dù có tạo task hay không (tránh xử lý AI lại lần sau)
                    _context.UserMemories.Add(new UserMemory
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Category = "SyncedGmail",
                        Key = gmail.Id,
                        Value = "synced",
                        Source = "system",
                        CreatedAt = today,
                        UpdatedAt = today
                    });

                    if (cleanedJson != "{}")
                    {
                        try
                        {
                            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                            var extractedTask = JsonSerializer.Deserialize<ExtractedGmailTaskDto>(cleanedJson, options);

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
                                    DueDate = extractedTask.DueDate.HasValue
                                    ? DateTime.SpecifyKind(extractedTask.DueDate.Value, DateTimeKind.Utc)
                                    : today.AddDays(1),
                                    InputMethod = "ai",
                                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc)
                                });
                                addedTasks++;
                            }
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogWarning("Parse JSON thất bại cho gmail: {Json}, lỗi: {Error}", cleanedJson, ex.Message);
                            continue;
                        }
                    }
                }

                await _context.SaveChangesAsync();

                return Ok(new ApiResponse<string>(
                    $"Đồng bộ hoàn tất! AI đã thêm {addedTasks} công việc mới. Bỏ qua {skippedDuplicates} email đã đồng bộ trước đó."));
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

        // 5. TÓM TẮT GMAIL BẰNG AI
        [HttpPost("summarize/{messageId}")]
        public async Task<IActionResult> SummarizeGmail(string messageId)
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

                var content = !string.IsNullOrWhiteSpace(gmail.Body)
                    ? gmail.Body
                    : gmail.Snippet;

                var prompt = $@"
Bạn là trợ lý tóm tắt email chuyên nghiệp. Hãy tóm tắt email sau bằng tiếng Việt, ngắn gọn, súc tích.

Người gửi: {gmail.From}
Tiêu đề: {gmail.Subject}
Nội dung:
{content}

Yêu cầu:
- Tóm tắt trong 3-5 câu
- Nêu rõ: mục đích chính, thông tin quan trọng, hành động cần làm (nếu có)
- Chỉ trả về đoạn tóm tắt, không giải thích thêm
";

                var summary = await _aiService.ChatAsync(prompt);
                return Ok(new ApiResponse<string>(summary.Trim(), "Thành công"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi: {ex.Message}"));
            }
        }

        // 6. TÓM TẮT TẤT CẢ GMAIL TRONG INBOX (theo thứ tự)
        [HttpPost("summarize-all")]
        public async Task<IActionResult> SummarizeAllGmails([FromQuery] int maxResults = 15)
        {
            var userId = GetUserId();

            var googleTokenMemory = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == "OAuth" && m.Key == "Google_RefreshToken");

            if (googleTokenMemory == null)
                return BadRequest(new ApiResponse<string>("Chưa liên kết Gmail!"));

            try
            {
                var accessToken = await _gmailService.GetNewAccessTokenAsync(googleTokenMemory.Value);
                var gmails = await _gmailService.GetInboxGmailsAsync(accessToken, maxResults, "primary");

                if (gmails == null || gmails.Count == 0)
                    return Ok(new ApiResponse<List<GmailSummaryItemDto>>(new List<GmailSummaryItemDto>(), "Không có email nào."));

                var results = new GmailSummaryItemDto[gmails.Count];
                var semaphore = new SemaphoreSlim(4); // giới hạn 4 request AI song song để tránh quá tải

                var tasks = gmails.Select(async (gmail, index) =>
                {
                    await semaphore.WaitAsync();
                    try
                    {
                        string body = gmail.Snippet;
                        try
                        {
                            var detail = await _gmailService.GetGmailDetailAsync(accessToken, gmail.Id);
                            body = !string.IsNullOrWhiteSpace(detail.Body) ? detail.Body : detail.Snippet;
                        }
                        catch
                        {
                            // Nếu lấy chi tiết lỗi thì dùng tạm snippet đã có
                        }

                        var prompt = $@"
Tóm tắt email sau bằng tiếng Việt trong TỐI ĐA 2 câu, ngắn gọn, chỉ nêu ý chính và hành động cần làm (nếu có). Không chào hỏi, không giải thích thêm, chỉ trả về đoạn tóm tắt.

Người gửi: {gmail.From}
Tiêu đề: {gmail.Subject}
Nội dung: {body}
";
                        string summary;
                        try
                        {
                            summary = (await _aiService.ChatAsync(prompt)).Trim();
                        }
                        catch
                        {
                            summary = "Không thể tóm tắt email này.";
                        }

                        results[index] = new GmailSummaryItemDto
                        {
                            Index = index + 1,
                            Id = gmail.Id,
                            From = gmail.From,
                            Subject = gmail.Subject,
                            Date = gmail.Date,
                            Summary = summary
                        };
                    }
                    finally
                    {
                        semaphore.Release();
                    }
                });

                await System.Threading.Tasks.Task.WhenAll(tasks);

                return Ok(new ApiResponse<List<GmailSummaryItemDto>>(results.ToList(), "Thành công"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi: {ex.Message}"));
            }
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

    public class GmailSummaryItemDto
    {
        public int Index { get; set; }
        public string Id { get; set; } = null!;
        public string From { get; set; } = null!;
        public string Subject { get; set; } = null!;
        public string Date { get; set; } = null!;
        public string Summary { get; set; } = null!;
    }
}