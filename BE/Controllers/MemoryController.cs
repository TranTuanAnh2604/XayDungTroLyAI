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
                .Where(m => m.UserId == userId)
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
            var now = DateTime.UtcNow;
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
    }
}