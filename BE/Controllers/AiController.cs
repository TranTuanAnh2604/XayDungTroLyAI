using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Assistant.Models;
using Assistant.Services;
using Assistant.Wrappers;
using System.Text.Json;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bắt buộc đăng nhập
    public class AiController : ControllerBase
    {
        private readonly GroqService _aiService;
        private readonly AppDbContext _context;

        public AiController(GroqService aiService, AppDbContext context)
        {
            _aiService = aiService;
            _context = context;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // =========================================================================
        // 1. API TRÒ CHUYỆN (MODULE 3) - RAG CHAT
        // =========================================================================
        [HttpPost("chat-rag")]
        public async Task<IActionResult> ChatWithRag([FromBody] ChatRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(new ApiResponse<string>("Nội dung tin nhắn không được để trống!"));

            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);
            string userName = user?.Name ?? "Người dùng";

            var memories = await _context.UserMemories
                .Where(m => m.UserId == userId)
                .Select(m => $"- {m.Category} | {m.Key}: {m.Value}")
                .ToListAsync();

            var activeTasks = await _context.Tasks
                .Where(t => t.UserId == userId && t.Status == "pending")
                .OrderBy(t => t.DueDate)
                .Take(10) // Lấy 10 việc cho chắc
                .Select(t => $"- Sự kiện/Công việc: {t.Title} | Thời gian diễn ra: {t.DueDate:dd/MM/yyyy HH:mm}")
                .ToListAsync();

            var contextData = $"DỮ LIỆU CÁ NHÂN CỦA USER ({userName.ToUpper()}):\n";
            if (memories.Any()) contextData += "[Sở thích & Ghi chú cá nhân]:\n" + string.Join("\n", memories) + "\n\n";
            if (activeTasks.Any()) contextData += "[Lịch trình công việc sắp tới]:\n" + string.Join("\n", activeTasks) + "\n\n";

            var finalPrompt = $@"
Bạn là trợ lý ảo cá nhân thông minh.
Dưới đây là tài liệu ngữ cảnh về người dùng hiện tại:
- Tên người dùng: {userName}
{contextData}

HƯỚNG DẪN TRẢ LỜI (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):
1. Xưng ""Tôi"", gọi người dùng là ""bạn"" hoặc ""{userName}"".
2. Trả lời CỰC KỲ NGẮN GỌN, ĐI THẲNG VÀO TRỌNG TÂM. Tuyệt đối không nói dài dòng, không rào trước đón sau.
3. Không khuyên bảo hay đặt câu hỏi ngược lại cho người dùng trừ khi thực sự cần thiết.
4. Lưu ý: ""Thời gian diễn ra"" trong lịch trình chính là thời gian hẹn gặp mặt hoặc làm việc.

Câu hỏi của {userName}: {request.Message}
";
            try
            {
                var aiResponse = await _aiService.ChatAsync(finalPrompt);
                return Ok(new ApiResponse<string>(aiResponse, "AI phản hồi thành công."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi xử lý AI: {ex.Message}"));
            }
        }

        // =========================================================================
        // 2. API HỌC TẬP KÝ ỨC (MODULE 1) 
        // =========================================================================
        [HttpPost("learn-fact")]
        public async Task<IActionResult> LearnFact([FromBody] ChatRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(new ApiResponse<string>("Câu nói trống!"));

            var userId = GetUserId();

            var prompt = $@"
Nhiệm vụ: Phân tích câu nói của người dùng và trích xuất thông tin cá nhân (sở thích, thói quen...) thành mảng JSON.
- Category: Ghi bằng tiếng Anh ngắn gọn (ví dụ: 'Preference', 'Habit', 'Relationship').
- Key: Từ khóa viết liền không dấu. NẾU CÓ NHẮC ĐẾN NGƯỜI KHÁC, BẮT BUỘC PHẢI GẮN TÊN NGƯỜI ĐÓ VÀO KEY (ví dụ: 'AnhVinh_Drink', 'Boss_Coffee', 'My_Hobby').
- Value: Nội dung chi tiết bằng tiếng Việt. CHÚ Ý: BẮT BUỘC PHẢI GIỮ LẠI TÊN NGƯỜI CHỦ THỂ TRONG CÂU (ví dụ: 'Anh Vinh không thích uống trà sữa', chứ đừng ghi cộc lốc là 'Không thích uống trà sữa').

Câu người dùng: ""{request.Message}""

RÀO CẢN BẢO MẬT: 
- Chỉ trả về duy nhất chuỗi JSON dạng mảng.
- KHÔNG giải thích, KHÔNG thêm từ ngữ chào hỏi.
- Nếu không có thông tin gì để nhớ, trả về [].

Định dạng bắt buộc:
[ {{ ""Category"": ""..."", ""Key"": ""..."", ""Value"": ""..."" }} ]
";
            try
            {
                var aiResult = await _aiService.ChatAsync(prompt);
                aiResult = CleanJsonString(aiResult);

                var rawMemories = JsonSerializer.Deserialize<List<MemoryExtractionDto>>(aiResult);
                if (rawMemories == null || !rawMemories.Any())
                    return Ok(new ApiResponse<string>("Không tìm thấy thông tin cần ghi nhớ."));

                // BƯỚC ÉP KIỂU: Gộp các Object có cùng Category và Key lại với nhau
                var extractedMemories = rawMemories
                    .Where(m => !string.IsNullOrEmpty(m.Category) && !string.IsNullOrEmpty(m.Key))
                    .GroupBy(m => new { m.Category, m.Key })
                    .Select(g => new MemoryExtractionDto
                    {
                        Category = g.Key.Category,
                        Key = g.Key.Key,
                        // Nếu AI lỡ tách ra làm 2 dòng, mình nối nó lại bằng chữ " VÀ "
                        Value = string.Join(" VÀ ", g.Select(x => x.Value))
                    }).ToList();

                int savedCount = 0;
                foreach (var item in extractedMemories)
                {
                    var existing = await _context.UserMemories
                        .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == item.Category && m.Key == item.Key);

                    if (existing != null)
                    {
                        existing.Value = item.Value;
                        existing.UpdatedAt = DateTime.UtcNow;
                        existing.Source = "ai_updated";
                    }
                    else
                    {
                        _context.UserMemories.Add(new UserMemory
                        {
                            Id = Guid.NewGuid(),
                            UserId = userId,
                            Category = item.Category,
                            Key = item.Key,
                            Value = item.Value,
                            Source = "ai_inferred",
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow
                        });
                    }
                    savedCount++;
                }

                await _context.SaveChangesAsync();
                return Ok(new ApiResponse<object>(extractedMemories, $"Đã ghi nhớ {savedCount} thông tin!"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi khi ghi nhớ: {ex.Message}"));
            }
        }

        // =========================================================================
        // 3. API THÊM LỊCH THÔNG MINH (MODULE 2 & 4)
        // =========================================================================
        [HttpPost("smart-add-task")]
        public async Task<IActionResult> SmartAddTask([FromBody] ChatRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest(new ApiResponse<string>("Câu lệnh trống!"));

            var userId = GetUserId();
            var today = DateTime.Now;

            // Lấy danh sách việc chưa làm để đưa cho AI check trùng lịch
            var pendingTasks = await _context.Tasks
                .Where(t => t.UserId == userId && t.Status == "pending" && t.DueDate > today)
                .Select(t => $"- {t.Title} (Lúc {t.DueDate:HH:mm dd/MM/yyyy})")
                .ToListAsync();
            var currentSchedule = string.Join("\n", pendingTasks);

            var prompt = $@"
Thời gian hiện tại của hệ thống: {today:dd/MM/yyyy HH:mm}
Lịch trình hiện tại của người dùng:
{currentSchedule}

Nhiệm vụ: Phân tích câu lệnh của người dùng để tạo công việc mới. 
- Đánh giá Priority (1: Gấp, 2: Bình thường, 3: Rảnh rỗi).
- Kiểm tra xem giờ mới có bị trùng với 'Lịch trình hiện tại' không.

Trả về chuỗi JSON duy nhất, KHÔNG giải thích dông dài bên ngoài:
{{
  ""Title"": ""Tên công việc ngắn gọn"",
  ""Priority"": 2,
  ""DueDate"": ""yyyy-MM-ddTHH:mm:ss"",
  ""IsConflict"": false,
  ""ConflictWarning"": """"
}}

Câu lệnh: ""{request.Message}""
";
            try
            {
                var aiResult = await _aiService.ChatAsync(prompt);
                aiResult = CleanJsonString(aiResult);

                var extractedTask = JsonSerializer.Deserialize<ExtractedTaskDto>(aiResult);

                if (extractedTask != null && !string.IsNullOrEmpty(extractedTask.Title))
                {
                    var newTask = new Assistant.Models.Task // Chỉ định rõ Task của Models
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Title = extractedTask.Title,
                        Description = "Tạo qua AI",
                        Status = "pending",
                        Priority = (byte)extractedTask.Priority,
                        DueDate = extractedTask.DueDate ?? DateTime.Now.AddDays(1),
                        InputMethod = "text"
                    };

                    _context.Tasks.Add(newTask);
                    await _context.SaveChangesAsync();

                    return Ok(new ApiResponse<object>(new
                    {
                        Task = newTask,
                        IsConflict = extractedTask.IsConflict,
                        Warning = extractedTask.ConflictWarning
                    }, "Đã tạo công việc thành công!"));
                }

                return BadRequest(new ApiResponse<string>("AI không thể trích xuất công việc từ câu nói này."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi xử lý tạo việc: {ex.Message}"));
            }
        }

        // =========================================================================
        // HÀM HỖ TRỢ: LÀM SẠCH CHUỖI JSON TỪ AI
        // =========================================================================
        private string CleanJsonString(string jsonString)
        {
            if (string.IsNullOrWhiteSpace(jsonString)) return "{}";

            var cleaned = jsonString.Trim();

            // 1. Cắt bỏ tag markdown ```json và ``` nếu có
            if (cleaned.StartsWith("```json")) cleaned = cleaned.Substring(7);
            else if (cleaned.StartsWith("```")) cleaned = cleaned.Substring(3);

            if (cleaned.EndsWith("```")) cleaned = cleaned.Substring(0, cleaned.Length - 3);
            cleaned = cleaned.Trim();

            // 2. Nếu chuỗi chứa mảng JSON [ ... ] (Dùng cho API learn-fact)
            int firstBracket = cleaned.IndexOf('[');
            int lastBracket = cleaned.LastIndexOf(']');
            if (firstBracket != -1 && lastBracket != -1 && lastBracket > firstBracket)
            {
                return cleaned.Substring(firstBracket, lastBracket - firstBracket + 1);
            }

            // 3. Nếu chuỗi chứa đối tượng JSON { ... } (Dùng cho API smart-add-task)
            int firstBrace = cleaned.IndexOf('{');
            int lastBrace = cleaned.LastIndexOf('}');
            if (firstBrace != -1 && lastBrace != -1 && lastBrace > firstBrace)
            {
                return cleaned.Substring(firstBrace, lastBrace - firstBrace + 1);
            }

            return "{}";
        }
    }

        // =========================================================================
        // CÁC CLASS DTO HỨNG DỮ LIỆU
        // =========================================================================
        public class ChatRequestDto
    {
        public string Message { get; set; } = null!;
    }

    public class MemoryExtractionDto
    {
        public string Category { get; set; } = null!;
        public string Key { get; set; } = null!;
        public string Value { get; set; } = null!;
    }

    public class ExtractedTaskDto
    {
        public string Title { get; set; } = null!;
        public int Priority { get; set; }
        public DateTime? DueDate { get; set; }
        public bool IsConflict { get; set; }
        public string? ConflictWarning { get; set; }
    }
}