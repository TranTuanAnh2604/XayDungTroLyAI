using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Assistant.DTOs;
using Assistant.Wrappers;
using Assistant.Models;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {

        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        public NotificationsController(AppDbContext context, IConfiguration configuration)  // thêm configuration
        {
            _context = context;
            _configuration = configuration;  // thêm dòng này
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // GET /api/notifications — lấy tất cả notifications của user
        [HttpGet]
        public async Task<IActionResult> GetNotifications()
        {
            var userId = GetUserId();
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.ScheduledAt)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Body = n.Body,
                    Type = n.Type,
                    ScheduledAt = n.ScheduledAt,
                    SentAt = n.SentAt,
                    Status = n.Status,
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<NotificationDto>>(notifications, "Lấy danh sách nhắc nhở thành công!"));
        }

        // GET /api/notifications/pending — lấy notifications chưa gửi và đến giờ rồi (FE polling)
        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var userId = GetUserId();
            var now = DateTime.UtcNow;
            var pending = await _context.Notifications
                .Where(n => n.UserId == userId && n.Status == "pending" && n.ScheduledAt <= now)
                .Select(n => new NotificationDto
                {
                    Id = n.Id,
                    Title = n.Title,
                    Body = n.Body,
                    Type = n.Type,
                    ScheduledAt = n.ScheduledAt,
                    SentAt = n.SentAt,
                    Status = n.Status,
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<NotificationDto>>(pending, "OK"));
        }

        // POST /api/notifications — tạo reminder mới

        [HttpPost]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto request)
        {
            var notification = new Notification
            {
                UserId = GetUserId(),
                Title = request.Title,
                Body = request.Body,
                Type = "reminder",
                ScheduledAt = request.ScheduledAt.ToUniversalTime(),
                Status = "pending",
            };

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<Guid>(notification.Id, "Tạo nhắc nhở thành công!"));
        }

        // PUT /api/notifications/{id}/sent — đánh dấu đã gửi (FE gọi sau khi hiện browser notification)
        [HttpPut("{id}/sent")]
        public async Task<IActionResult> MarkAsSent(Guid id)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == GetUserId());

            if (notification == null) return NotFound();

            notification.Status = "sent";
            notification.SentAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>(true, "Đã đánh dấu đã gửi!"));
        }

        // DELETE /api/notifications/{id} — xoá reminder
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(Guid id)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && n.UserId == GetUserId());

            if (notification == null) return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>(true, "Xoá nhắc nhở thành công!"));
        }
        // Thêm endpoint này vào NotificationsController.cs
        // Cần thêm package: dotnet add package System.Net.Http.Json

        // POST /api/notifications/ai-suggest
        [HttpPost("ai-suggest")]
        public async Task<IActionResult> AiSuggestReminder([FromBody] AiSuggestDto request)
        {
            var apiKey = _configuration["Anthropic:ApiKey"]; // lấy từ appsettings.json

            var prompt = $@"Bạn là AI assistant giúp lên lịch nhắc nhở công việc.

                Thông tin task:
                - Tiêu đề: {request.Title}
                - Mô tả: {request.Description ?? "Không có"}
                - Mức ưu tiên: {(request.Priority == 3 ? "Khẩn cấp" : request.Priority == 1 ? "Thấp" : "Bình thường")}
                - Deadline: {(request.DueDate.HasValue ? request.DueDate.Value.ToLocalTime().ToString("dd/MM/yyyy") : "Không có")}
               - Thời gian hiện tại: {TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "SE Asia Standard Time"):dd/MM/yyyy HH:mm}
               - Deadline cụ thể: {(request.DueDate.HasValue ? TimeZoneInfo.ConvertTimeBySystemTimeZoneId(request.DueDate.Value, "SE Asia Standard Time").ToString("dd/MM/yyyy HH:mm") : "Không có")}

                Hãy đề xuất MỘT thời gian nhắc nhở phù hợp nhất cho task này.
                Lưu ý quan trọng:
                - Nếu deadline còn ít hơn 2 tiếng, hãy nhắc ngay sau 15-30 phút.
                - Nếu deadline trong hôm nay, nhắc trước 1-2 tiếng.
                - Nếu deadline ngày mai trở đi, nhắc lúc 8h sáng ngày hôm trước.
                - scheduledAt phải trả về theo định dạng ISO 8601 giờ Việt Nam (UTC+7).
                                Trả lời ĐÚNG định dạng JSON sau, không thêm gì khác:
                {{
                  ""scheduledAt"": ""2025-06-18T08:00:00"",
                  ""reason"": ""Lý do ngắn gọn bằng tiếng Việt""
                }}";

            using var http = new HttpClient();
            http.DefaultRequestHeaders.Add("x-api-key", apiKey);
            http.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

            var body = new
            {
                model = "claude-sonnet-4-6",
                max_tokens = 200,
                messages = new[] { new { role = "user", content = prompt } }
            };

            var response = await http.PostAsJsonAsync("https://api.anthropic.com/v1/messages", body);
            var result = await response.Content.ReadFromJsonAsync<AnthropicResponse>();

            var text = result?.Content?.FirstOrDefault()?.Text ?? "";

            // Parse JSON từ response
            try
            {
                var clean = text.Replace("```json", "").Replace("```", "").Trim();
                var suggestion = System.Text.Json.JsonSerializer.Deserialize<AiSuggestionResult>(clean,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                return Ok(new ApiResponse<AiSuggestionResult>(suggestion!, "OK"));
            }
            catch
            {
                // Fallback nếu AI không trả về đúng format
                var fallback = new AiSuggestionResult
                {
                    ScheduledAt = request.DueDate.HasValue
                        ? request.DueDate.Value.AddDays(-1).Date.AddHours(8)
                        : DateTime.Now.AddMinutes(30),
                    Reason = "Nhắc trước deadline 1 ngày lúc 8h sáng"
                };
                return Ok(new ApiResponse<AiSuggestionResult>(fallback, "OK"));
            }
        }
    }

}