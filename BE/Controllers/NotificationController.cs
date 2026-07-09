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
        private readonly ILogger<NotificationsController> _logger;
        public NotificationsController(AppDbContext context, IConfiguration configuration, ILogger<NotificationsController> logger)  // thêm configuration
        {
            _context = context;
            _logger = logger;
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
                ScheduledAt = request.ScheduledAt.Kind == DateTimeKind.Utc
                ? request.ScheduledAt
                : request.ScheduledAt.ToUniversalTime(),
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
            var apiKey = _configuration["Groq:ApiKey"];
            var userId = GetUserId();
            _logger.LogInformation("=== AiSuggestReminder (Groq) called === ApiKey length: {Len}", apiKey?.Length ?? 0);

            // Lấy các task khác của user có deadline gần với task hiện tại (trong vòng +-6 tiếng)
            // để AI biết có bị trùng lịch không và ưu tiên task quan trọng hơn
            List<string> nearbyTasksInfo = new();
            if (request.DueDate.HasValue)
            {
                var windowStart = request.DueDate.Value.AddHours(-6);
                var windowEnd = request.DueDate.Value.AddHours(6);

                var nearbyTasks = await _context.Tasks
                    .Where(t => t.UserId == userId
                                && t.Status != "completed"
                                && t.DueDate.HasValue
                                && t.DueDate.Value >= windowStart
                                && t.DueDate.Value <= windowEnd
                                && t.Title != request.Title) // loại chính task đang xét
                    .OrderBy(t => t.DueDate)
                    .Take(5)
                    .ToListAsync();

                var vnTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                foreach (var t in nearbyTasks)
                {
                    var localDue = TimeZoneInfo.ConvertTimeFromUtc(t.DueDate!.Value, vnTimeZone);
                    var priorityLabel = t.Priority == 3 ? "Khẩn cấp" : t.Priority == 1 ? "Thấp" : "Bình thường";
                    nearbyTasksInfo.Add($"- \"{t.Title}\" (mức ưu tiên: {priorityLabel}, deadline: {localDue:dd/MM/yyyy HH:mm})");
                }
            }

            var nearbyTasksText = nearbyTasksInfo.Count > 0
                ? string.Join("\n", nearbyTasksInfo)
                : "Không có task nào khác gần thời điểm này";

            var prompt = $@"Bạn là AI assistant giúp lên lịch nhắc nhở công việc.
    Thông tin task cần đặt nhắc nhở:
    - Tiêu đề: {request.Title}
    - Mô tả: {request.Description ?? "Không có"}
    - Mức ưu tiên: {(request.Priority == 3 ? "Khẩn cấp" : request.Priority == 1 ? "Thấp" : "Bình thường")}
    - Deadline cụ thể: {(request.DueDate.HasValue ? TimeZoneInfo.ConvertTimeBySystemTimeZoneId(request.DueDate.Value, "SE Asia Standard Time").ToString("dd/MM/yyyy HH:mm") : "Không có")}
    - Thời gian hiện tại: {TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTime.UtcNow, "SE Asia Standard Time"):dd/MM/yyyy HH:mm}

    Các task khác của user có deadline gần thời điểm này (để bạn xét trùng lịch):
    {nearbyTasksText}

    QUAN TRỌNG - Nguyên tắc bắt buộc:
    1. Deadline là HẠN CHÓT CUỐI CÙNG, tuyệt đối không được để việc hoàn thành công việc. scheduledAt PHẢI luôn nhắc TRƯỚC deadline, không bao giờ được bằng hoặc sau deadline.
    2. Nếu có task khác trùng hoặc gần thời điểm nhắc (xem danh sách trên), hãy ưu tiên: task có mức ưu tiên cao hơn (Khẩn cấp > Bình thường > Thấp) nên được nhắc SỚM HƠN so với task ít quan trọng hơn, để người dùng có đủ thời gian xử lý việc quan trọng trước. Nếu task hiện tại có ưu tiên thấp hơn nhưng lại trùng giờ với một task Khẩn cấp khác, hãy dời nhắc nhở của task hiện tại ra sớm hơn hoặc muộn hơn một chút (nhưng vẫn phải trước deadline của chính nó) để tránh dồn 2 việc quan trọng vào cùng lúc.

    Hãy tính toán chính xác và đề xuất MỘT thời gian nhắc nhở dựa trên các quy tắc sau:
    - Nếu deadline còn hơn 2 tiếng: nhắc trước deadline 1-2 tiếng (ví dụ deadline 21:00 thì nhắc lúc 19:00 hoặc 19:30)
    - Nếu deadline còn 1-2 tiếng: nhắc ngay sau 15-30 phút kể từ bây giờ
    - Nếu deadline còn dưới 1 tiếng: nhắc ngay sau 5-10 phút
    - Nếu không có deadline: nhắc sau 30 phút kể từ bây giờ
    - scheduledAt PHẢI là thời gian trong tương lai, KHÔNG được nhỏ hơn thời gian hiện tại, và KHÔNG được bằng hoặc lớn hơn deadline
    - scheduledAt trả về theo định dạng ISO 8601 giờ Việt Nam (UTC+7), ví dụ: 2025-07-08T19:00:00

    Trả lời ĐÚNG định dạng JSON sau, không thêm gì khác, không giải thích:
    {{
      ""scheduledAt"": ""2025-07-08T19:00:00"",
      ""reason"": ""Nhắc trước deadline 2 tiếng (deadline 21:00 ngày 08/07)""
    }}";

            using var http = new HttpClient();
            http.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);

            var body = new
            {
                model = "openai/gpt-oss-20b",
                messages = new[]
                {
            new { role = "user", content = prompt }
        },
                max_completion_tokens = 1024,
                reasoning_effort = "low",
                response_format = new { type = "json_object" }
            };

            var response = await http.PostAsJsonAsync("https://api.groq.com/openai/v1/chat/completions", body);
            var rawBody = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Groq status: {Status} | Body: {Body}", response.StatusCode, rawBody);

            var fallback = new AiSuggestionResult
            {
                ScheduledAt = request.DueDate.HasValue
                    ? request.DueDate.Value.AddDays(-1).Date.AddHours(8)
                    : DateTime.Now.AddMinutes(30),
                Reason = "Nhắc trước deadline 1 ngày lúc 8h sáng"
            };

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Groq API lỗi: {Status}", response.StatusCode);
                return Ok(new ApiResponse<AiSuggestionResult>(fallback, "OK"));
            }

            string text;
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(rawBody);
                text = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString() ?? "";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Không lấy được text từ response Groq. Raw: {Raw}", rawBody);
                return Ok(new ApiResponse<AiSuggestionResult>(fallback, "OK"));
            }

            _logger.LogInformation("Groq text trả về: {Text}", text);

            try
            {
                var clean = text.Replace("```json", "").Replace("```", "").Trim();
                var suggestion = System.Text.Json.JsonSerializer.Deserialize<AiSuggestionResult>(clean,
                    new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                var vnTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
                var localTime = suggestion!.ScheduledAt;
                if (localTime.Kind == DateTimeKind.Unspecified)
                {
                    suggestion.ScheduledAt = TimeZoneInfo.ConvertTimeToUtc(localTime, vnTimeZone);
                }

                // Kiểm tra an toàn: đảm bảo scheduledAt luôn TRƯỚC deadline (không tin tưởng tuyệt đối vào AI)
                if (request.DueDate.HasValue && suggestion.ScheduledAt >= request.DueDate.Value)
                {
                    _logger.LogWarning("AI đề xuất scheduledAt >= deadline, tự động lùi lại 30 phút trước deadline");
                    suggestion.ScheduledAt = request.DueDate.Value.AddMinutes(-30);
                }

                return Ok(new ApiResponse<AiSuggestionResult>(suggestion, "OK"));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Parse thất bại. Raw text: {Text}", text);
                return Ok(new ApiResponse<AiSuggestionResult>(fallback, "OK"));
            }
        }
    }
 }