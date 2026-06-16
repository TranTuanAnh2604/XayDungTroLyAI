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
    [Authorize] // Bắt buộc phải kẹp Access Token
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpGet("me")]
        public async Task<IActionResult> GetProfile()
        {
            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return NotFound(new ApiResponse<string>("Không tìm thấy user"));

            var profile = new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Timezone = user.Timezone
            };

            return Ok(new ApiResponse<UserProfileDto>(profile, "Lấy thông tin thành công!"));
        }

        [HttpPut("me")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return NotFound(new ApiResponse<string>("Không tìm thấy user"));

            user.Name = request.Name;
            user.Timezone = request.Timezone;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>(user.Name, "Cập nhật Profile thành công!"));
        }

        [HttpPost("me/preferences")]
        public async Task<IActionResult> SavePreference([FromBody] UserMemoryDto request)
        {
            var userId = GetUserId();
            var memory = await _context.UserMemories
                .FirstOrDefaultAsync(m => m.UserId == userId && m.Category == request.Category && m.Key == request.Key);

            if (memory != null)
            {
                memory.Value = request.Value;
                memory.UpdatedAt = DateTime.UtcNow;
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
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new ApiResponse<string>("Đã ghi nhớ sở thích của bạn cho AI!"));
        }

        [HttpPut("me/password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            var user = await _context.Users.FindAsync(GetUserId());
            if (user == null) return NotFound(new ApiResponse<string>("Không tìm thấy user"));

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
                return BadRequest(new ApiResponse<string>("Mật khẩu hiện tại không đúng!"));

            if (request.NewPassword != request.ConfirmPassword)
                return BadRequest(new ApiResponse<string>("Mật khẩu mới không khớp!"));

            if (request.NewPassword.Length < 8)
                return BadRequest(new ApiResponse<string>("Mật khẩu phải có ít nhất 8 ký tự!"));

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>("Đổi mật khẩu thành công!"));
        }

        public class ChangePasswordDto
        {
            public string CurrentPassword { get; set; } = null!;
            public string NewPassword { get; set; } = null!;
            public string ConfirmPassword { get; set; } = null!;
        }
    }
}