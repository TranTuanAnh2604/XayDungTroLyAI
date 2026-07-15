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
    public class MemoryController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GroqService _groqService;

        // Giới hạn kích thước file để tránh tốn token / bị lạm dụng
        private const long MaxFileSizeBytes = 200 * 1024; // 200 KB

        public MemoryController(AppDbContext context, GroqService groqService)
        {
            _context = context;
            _groqService = groqService;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // GET /api/memory — xem toàn bộ thông tin cá nhân hóa đã lưu
        [HttpGet]
        public async Task<IActionResult> GetMyMemories()
        {
            var userId = GetUserId();
            var memories = await _context.UserMemories
                .Where(m => m.UserId == userId && m.Category != "OAuth" && m.Category != "SyncedGmail")
                .OrderByDescending(m => m.UpdatedAt)
                .Select(m => new
                {
                    m.Id,
                    m.Category,
                    m.Key,
                    m.Value,
                    m.Source,
                    m.UpdatedAt
                })
                .ToListAsync();

            return Ok(new ApiResponse<object>(memories, "Lấy thông tin cá nhân hóa thành công!"));
        }

        // POST /api/memory/upload — upload file văn bản tự do, AI tự tách thành UserMemory
        [HttpPost("upload")]
        public async Task<IActionResult> UploadMemoryFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new ApiResponse<string>("Vui lòng chọn file!"));

            if (file.Length > MaxFileSizeBytes)
                return BadRequest(new ApiResponse<string>("File quá lớn, giới hạn 200KB văn bản!"));

            string rawText;
            using (var reader = new StreamReader(file.OpenReadStream(), Encoding.UTF8))
            {
                rawText = await reader.ReadToEndAsync();
            }

            if (string.IsNullOrWhiteSpace(rawText))
                return BadRequest(new ApiResponse<string>("File không có nội dung!"));

            List<(string Category, string Key, string Value)> extracted;
            try
            {
                extracted = await _groqService.ExtractMemoriesAsync(rawText);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi khi AI xử lý file: {ex.Message}"));
            }

            if (extracted.Count == 0)
                return Ok(new ApiResponse<string>("Không trích xuất được thông tin nào hữu ích từ file.", "Hoàn tất!"));

            // Loại bỏ trùng lặp NGAY TRONG DANH SÁCH trích xuất, tránh insert 2 dòng cùng
            // (UserId, Category, Key) trong 1 lượt SaveChanges → vi phạm unique constraint.
            // Giữ mục cuối cùng nếu có nhiều mục trùng category+key trong cùng file.
            var dedupedExtracted = extracted
                .GroupBy(x => (x.Category, x.Key))
                .Select(g => g.Last())
                .ToList();

            var userId = GetUserId();
            var now = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);
            int added = 0, updated = 0;

            foreach (var item in dedupedExtracted)
            {
                var existing = await _context.UserMemories.FirstOrDefaultAsync(m =>
                    m.UserId == userId && m.Category == item.Category && m.Key == item.Key);

                if (existing != null)
                {
                    existing.Value = item.Value;
                    existing.Source = "file_upload";
                    existing.UpdatedAt = now;
                    updated++;
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
                        Source = "file_upload",
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                    added++;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>(
                $"Đã thêm {added} mục mới, cập nhật {updated} mục đã có.",
                "Xử lý file thành công!"));
        }

        // DELETE /api/memory/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMemory(Guid id)
        {
            var entry = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == GetUserId());

            if (entry == null)
                return NotFound(new ApiResponse<string>("Không tìm thấy thông tin!"));

            _context.UserMemories.Remove(entry);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>(true, "Đã xóa!"));
        }

        // Các Key cố định cho khảo sát cá nhân hóa
        internal static readonly Dictionary<string, string> SurveyKeys = new()
        {
            ["SupportAreas"] = "Lĩnh vực AI hỗ trợ chính",
            ["ResponseStyle"] = "Phong cách trả lời mong muốn",
            ["Priorities"] = "Ưu tiên khi lập kế hoạch/gợi ý",
            ["Traits"] = "Đặc điểm làm việc của người dùng",
            ["ProactiveSupport"] = "Cách AI nên chủ động hỗ trợ",
            ["Hobbies"] = "Sở thích cá nhân",
            ["MusicGenres"] = "Thể loại nhạc yêu thích",
            ["FavoriteFoods"] = "Đồ ăn hoặc thức uống yêu thích",
            ["AiPersonality"] = "Tính cách AI mong muốn",
            ["PersonalPreferences"] = "Thông tin AI nên ghi nhớ",
        };

        // GET /api/memory/survey — lấy câu trả lời khảo sát đã lưu (để prefill popup)
        [HttpGet("survey")]
        public async Task<IActionResult> GetSurvey()
        {
            var userId = GetUserId();
            var rows = await _context.UserMemories
                .Where(m => m.UserId == userId && m.Category == "Survey")
                .ToListAsync();

            var result = new Dictionary<string, string>();
            foreach (var key in SurveyKeys.Keys)
            {
                var row = rows.FirstOrDefault(r => r.Key == key);
                result[key] = row?.Value ?? "";
            }

            bool completed = rows.Any();

            return Ok(new ApiResponse<object>(new { answers = result, completed }, "Lấy khảo sát thành công!"));
        }

        // POST /api/memory/survey — lưu/cập nhật câu trả lời khảo sát
        [HttpPost("survey")]
        public async Task<IActionResult> SaveSurvey([FromBody] SurveyDto dto)
        {
            var userId = GetUserId();
            var now = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);

            var values = new Dictionary<string, string>
            {
                ["SupportAreas"] = string.Join(", ", dto.SupportAreas ?? new()),
                ["ResponseStyle"] = dto.ResponseStyle ?? "",
                ["Priorities"] = string.Join(", ", dto.Priorities ?? new()),
                ["Traits"] = string.Join(", ", dto.Traits ?? new()),
                ["ProactiveSupport"] = string.Join(", ", dto.ProactiveSupport ?? new()),
                ["Hobbies"] = string.Join(", ", dto.Hobbies ?? new()),
                ["MusicGenres"] = string.Join(", ", dto.MusicGenres ?? new()),
                ["FavoriteFoods"] = string.Join(", ", dto.FavoriteFoods ?? new()),
                ["AiPersonality"] = string.Join(", ", dto.AiPersonality ?? new()),
                ["PersonalPreferences"] = string.Join(", ", dto.PersonalPreferences ?? new())
            };

            foreach (var kv in values)
            {
                if (string.IsNullOrWhiteSpace(kv.Value)) continue; // bỏ qua câu không trả lời

                var existing = await _context.UserMemories.FirstOrDefaultAsync(m =>
                    m.UserId == userId && m.Category == "Survey" && m.Key == kv.Key);

                if (existing != null)
                {
                    existing.Value = kv.Value;
                    existing.Source = "survey";
                    existing.UpdatedAt = now;
                }
                else
                {
                    _context.UserMemories.Add(new UserMemory
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Category = "Survey",
                        Key = kv.Key,
                        Value = kv.Value,
                        Source = "survey",
                        CreatedAt = now,
                        UpdatedAt = now
                    });
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>(true, "Đã lưu khảo sát cá nhân hóa!"));
        }
    }
}