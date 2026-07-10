using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Assistant.DTOs;
using Assistant.Models;
using Assistant.Wrappers;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;  // thêm để lưu file

        public UsersController(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        // ─── GET /api/users/me ────────────────────────────────────────────────
        [HttpGet("me")]
        public async System.Threading.Tasks.Task<IActionResult> GetProfile()
        {
            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return NotFound(new ApiResponse<string>("Không tìm thấy user"));

            return Ok(new ApiResponse<UserProfileDto>(new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Timezone = user.Timezone,
                AvatarUrl = user.AvatarUrl  
            }, "Lấy thông tin thành công!"));
        }

        // ─── PUT /api/users/me ────────────────────────────────────────────────
        [HttpPut("me")]
        public async System.Threading.Tasks.Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                return BadRequest(new ApiResponse<string>("Tên không được để trống!"));

            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return NotFound(new ApiResponse<string>("Không tìm thấy user"));

            user.Name = request.Name;
            user.Timezone = request.Timezone;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>(user.Name, "Cập nhật Profile thành công!"));
        }

        // ─── POST /api/users/me/avatar ────────────────────────────────────────
        [HttpPost("me/avatar")]
        public async System.Threading.Tasks.Task<IActionResult> UploadAvatar(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new ApiResponse<string>("Vui lòng chọn ảnh!"));

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return BadRequest(new ApiResponse<string>("Chỉ chấp nhận file ảnh (jpg, png, webp, gif)!"));

            const long maxSize = 10L * 1024 * 1024; // 10MB
            if (file.Length > maxSize)
                return BadRequest(new ApiResponse<string>("Ảnh không được vượt quá 10MB!"));

            // Lưu vào wwwroot/avatars/{userId}.ext
            var avatarFolder = Path.Combine(_env.WebRootPath ?? "wwwroot", "avatars");
            Directory.CreateDirectory(avatarFolder);

            var userId = GetUserId();
            var ext = Path.GetExtension(file.FileName).ToLower();
            var fileName = $"{userId}{ext}";
            var filePath = Path.Combine(avatarFolder, fileName);

            await using (var stream = new FileStream(filePath, FileMode.Create))
                await file.CopyToAsync(stream);

            var user = await _context.Users.FindAsync(userId);
            if (user == null) return NotFound(new ApiResponse<string>("Không tìm thấy user"));

            user.AvatarUrl = $"/avatars/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<object>(
                new { avatarUrl = user.AvatarUrl },
                "Cập nhật ảnh đại diện thành công!"));
        }

        // ─── POST /api/users/me/preferences ──────────────────────────────────
        [HttpPost("me/preferences")]
        public async System.Threading.Tasks.Task<IActionResult> SavePreference([FromBody] UserMemoryDto request)
        {
            var userId = GetUserId();
            var memory = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == request.Category && m.Key == request.Key);

            if (memory != null)
            {
                memory.Value = request.Value;
                memory.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);
            }
            else
            {
                _context.UserMemories.Add(new UserMemory
                {
                    UserId = userId,
                    Category = request.Category,
                    Key = request.Key,
                    Value = request.Value,
                    Source = "manual",
                    CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc),
                    UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc)
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new ApiResponse<string>("Đã ghi nhớ sở thích của bạn cho AI!"));
        }
    }
}