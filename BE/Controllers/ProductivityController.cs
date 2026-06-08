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
    [Authorize] // Bắt buộc đăng nhập
    public class ProductivityController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GroqService _aiService;

        public ProductivityController(AppDbContext context, GroqService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // =========================================================================
        // API: AI TỰ ĐỘNG PHÂN TÍCH & TẠO BÁO CÁO NĂNG SUẤT HÀNG TUẦN
        // =========================================================================
        [HttpPost("generate-weekly")]
        public async Task<IActionResult> GenerateWeeklyReport()
        {
            var userId = GetUserId();
            var today = DateTime.Today;
            var startOfWeek = today.AddDays(-(int)today.DayOfWeek + 1); // Thứ 2 tuần này
            var endOfWeek = startOfWeek.AddDays(6); // Chủ nhật tuần này

            // 1. Gom tất cả các việc đã hoàn thành trong tuần
            var completedTasks = await _context.Tasks
                .Where(t => t.UserId == userId && t.Status == "done" && t.DueDate >= startOfWeek && t.DueDate <= endOfWeek)
                .Select(t => $"- {t.Title} (Xong lúc: {t.CompletedAt:dd/MM/yyyy})")
                .ToListAsync();

            // 2. Gom tất cả các việc bị bỏ lỡ hoặc chưa làm (Trễ deadline)
            var pendingTasks = await _context.Tasks
                .Where(t => t.UserId == userId && t.Status == "pending" && t.DueDate < today)
                .Select(t => $"- {t.Title} (Hạn chót: {t.DueDate:dd/MM/yyyy})")
                .ToListAsync();

            // Tỷ lệ hoàn thành công việc
            double totalTasks = completedTasks.Count + pendingTasks.Count;
            double completionRate = totalTasks > 0 ? (double)completedTasks.Count / totalTasks : 0;

            var completedListText = completedTasks.Any() ? string.Join("\n", completedTasks) : "Không có công việc nào hoàn thành.";
            var pendingListText = pendingTasks.Any() ? string.Join("\n", pendingTasks) : "Không có công việc nào bị trễ.";

            // 3. Đưa dữ liệu cho AI làm "Sếp" nhận xét
            var prompt = $@"
Bạn là một chuyên gia đánh giá năng suất và quản lý thời gian cao cấp.
Hãy phân tích kết quả tuần này của người dùng dựa trên dữ liệu thực tế sau:
- Tỷ lệ hoàn thành: {completionRate * 100:0.0}%
- Các việc ĐÃ LÀM XONG:
{completedListText}

- Các việc BỊ TRỄ DEADLINE / CHƯA LÀM:
{pendingListText}

Nhiệm vụ: Hãy viết một bài đánh giá năng suất (report_data) bằng tiếng Việt thật tự nhiên, thẳng thắn. 
- Nếu tỷ lệ hoàn thành thấp, hãy phê bình một cách nghiêm túc và đưa ra lời khuyên.
- Nếu tỷ lệ cao, hãy khen ngợi khích lệ.
- Trả về duy nhất chuỗi JSON theo định dạng dưới đây, không giải thích gì thêm bên ngoài.

Định dạng JSON bắt buộc:
{{
  ""Feedback"": ""Nội dung bài đánh giá, nhận xét chi tiết của AI và lời khuyên cụ thể...""
}}";

            try
            {
                // 1. Gọi AI lấy bài nhận xét (Lúc này bắt nó nhả text tự do luôn, không ép ra JSON nữa cho đỡ lỗi)
                var aiResult = await _aiService.ChatAsync(prompt);

                // Phòng hờ AI nó vẫn ngoan cố bọc tag ``` hoặc viết hoa chữ Feedback, mình làm sạch tí
                string cleanFeedback = aiResult.Trim();
                if (cleanFeedback.Contains("```"))
                {
                    // Nếu nó lỡ nhét vô block code thì mình bóc cái ruột ra
                    cleanFeedback = cleanFeedback.Replace("```json", "").Replace("```", "").Trim();
                }

                // NẾU AI LỠ TRẢ VỀ DẠNG JSON TỪ TRƯỚC, MÌNH BÓC TEXT RA LUÔN CHO CHẮC CÚ
                if (cleanFeedback.StartsWith("{") && cleanFeedback.Contains("\"Feedback\""))
                {
                    try
                    {
                        using var jsonDoc = JsonDocument.Parse(cleanFeedback);
                        cleanFeedback = jsonDoc.RootElement.GetProperty("Feedback").GetString()!;
                    }
                    catch { /* Nếu parse lỗi thì giữ nguyên chuỗi thô xài luôn */ }
                }

                // 2. Lưu kết quả vào bảng productivity_reports của ông
                var report = new ProductivityReport
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    PeriodType = "weekly",
                    PeriodStart = DateOnly.FromDateTime(startOfWeek),
                    PeriodEnd = DateOnly.FromDateTime(endOfWeek),
                    ReportData = cleanFeedback, // Lưu trọn vẹn bài văn nhận xét sạch sẽ của AI
                    CompletionRate = completionRate,
                    GeneratedAt = DateTime.UtcNow
                };

                _context.ProductivityReports.Add(report);
                await _context.SaveChangesAsync();

                // 3. Trả về đúng định dạng ApiResponse xịn của ông (Success = true)
                return Ok(new ApiResponse<object>(new
                {
                    ReportId = report.Id,
                    Rate = $"{completionRate * 100:0.0}%",
                    AI_Evaluation = cleanFeedback
                }, "AI đã xuất báo cáo năng suất tuần này thành công!"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi khi tạo báo cáo: {ex.Message}"));
            }
        }
    }
}