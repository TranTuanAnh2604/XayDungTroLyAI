using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Assistant.Models;
using Assistant.Wrappers;
using Assistant.DTOs;
using Assistant.Services;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly GmailService _gmailService;
        private readonly ITimeTrackingService _timeTrackingService;

        public AuthController(
            AppDbContext context,
            IConfiguration config,
            IHttpClientFactory httpClientFactory,
            GmailService gmailService,
            ITimeTrackingService timeTrackingService)
        {
            _context = context;
            _config = config;
            _httpClient = httpClientFactory.CreateClient();
            _gmailService = gmailService;
            _timeTrackingService = timeTrackingService;
        }

        [HttpPost("register")]
        public async System.Threading.Tasks.Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new ApiResponse<string>("Email đã được sử dụng!"));

            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Timezone = "Asia/Ho_Chi_Minh"
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<string>(user.Email, "Đăng ký thành công!"));
        }

        [HttpPost("login")]
        public async System.Threading.Tasks.Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new ApiResponse<string>("Sai email hoặc mật khẩu!"));

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();
            await _timeTrackingService.StartSessionAsync(user.Id);

            return Ok(new ApiResponse<AuthResponseDto>(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                UserId = user.Id,
                Name = user.Name
            }, "Đăng nhập thành công!"));
        }

        [HttpPost("google-login")]
        public async System.Threading.Tasks.Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto request)
        {
            if (string.IsNullOrWhiteSpace(request.IdToken))
                return BadRequest(new ApiResponse<string>("Thiếu code từ Google!"));

            string googleAccessToken;
            string? googleRefreshToken = null;

            try
            {
                var tokenRequest = new Dictionary<string, string>
                {
                    { "code", request.IdToken },
                    { "client_id", _config["Google:ClientId"]! },
                    { "client_secret", _config["Google:ClientSecret"]! },
                    { "redirect_uri", "http://localhost:5173" },
                    { "grant_type", "authorization_code" }
                };

                var tokenResponse = await _httpClient.PostAsync(
                    "https://oauth2.googleapis.com/token",
                    new FormUrlEncodedContent(tokenRequest));

                var tokenJson = await tokenResponse.Content.ReadAsStringAsync();
                using var tokenDoc = JsonDocument.Parse(tokenJson);

                googleAccessToken = tokenDoc.RootElement.GetProperty("access_token").GetString()!;

                if (tokenDoc.RootElement.TryGetProperty("refresh_token", out var rt))
                    googleRefreshToken = rt.GetString();
            }
            catch
            {
                return Unauthorized(new ApiResponse<string>("Đổi code thất bại!"));
            }

            GoogleUserInfo? googleUser;
            try
            {
                var httpRequest = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/oauth2/v3/userinfo");
                httpRequest.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", googleAccessToken);
                var response = await _httpClient.SendAsync(httpRequest);

                if (!response.IsSuccessStatusCode)
                    return Unauthorized(new ApiResponse<string>("Xác thực Google thất bại!"));

                var json = await response.Content.ReadAsStringAsync();
                googleUser = JsonSerializer.Deserialize<GoogleUserInfo>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (googleUser == null || string.IsNullOrWhiteSpace(googleUser.Email))
                    return Unauthorized(new ApiResponse<string>("Không lấy được thông tin từ Google!"));
            }
            catch
            {
                return Unauthorized(new ApiResponse<string>("Xác thực Google thất bại!"));
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == googleUser.Email);
            if (user == null)
            {
                user = new User
                {
                    Name = googleUser.Name ?? "Google User",
                    Email = googleUser.Email,
                    PasswordHash = "GOOGLE_SSO_NO_PASSWORD",
                    Timezone = "Asia/Ho_Chi_Minh",
                    IsEmailVerified = true
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }
            else if (!user.IsEmailVerified)
            {
                user.IsEmailVerified = true;
            }

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(googleRefreshToken))
            {
                var existingToken = await _context.UserMemories
                    .FirstOrDefaultAsync(m => m.UserId == user.Id && m.Category == "OAuth" && m.Key == "Google_RefreshToken");

                if (existingToken != null)
                {
                    existingToken.Value = googleRefreshToken;
                    existingToken.UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);
                }
                else
                {
                    _context.UserMemories.Add(new UserMemory
                    {
                        Id = Guid.NewGuid(),
                        UserId = user.Id,
                        Category = "OAuth",
                        Key = "Google_RefreshToken",
                        Value = googleRefreshToken,
                        Source = "system",
                        CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc),
                        UpdatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc)
                    });
                }
                await _context.SaveChangesAsync();
                await _timeTrackingService.StartSessionAsync(user.Id);
            }

            return Ok(new ApiResponse<AuthResponseDto>(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                UserId = user.Id,
                Name = user.Name
            }, "Đăng nhập Google thành công!"));
        }

        [HttpPost("refresh_token")]
        public async System.Threading.Tasks.Task<IActionResult> RefreshToken([FromBody] TokenDto tokenModel)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == tokenModel.RefreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                return Unauthorized(new ApiResponse<string>("Token không hợp lệ hoặc đã hết hạn!"));

            var newAccessToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();
            user.RefreshToken = newRefreshToken;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<TokenResponseDto>(new TokenResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            }, "Làm mới Token thành công!"));
        }

        [HttpPost("send-otp")]
        public async System.Threading.Tasks.Task<IActionResult> SendOtp([FromBody] SendOtpDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Gmail))
                return BadRequest(new ApiResponse<string>("Vui lòng nhập email!"));

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Gmail);

            // User đã verify trước đó → đăng nhập luôn, không cần OTP
            if (user != null && user.IsEmailVerified)
            {
                var accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken();
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
                await _context.SaveChangesAsync();
                await _timeTrackingService.StartSessionAsync(user.Id);

                return Ok(new ApiResponse<AuthResponseDto>(new AuthResponseDto
                {
                    AccessToken = accessToken,
                    RefreshToken = refreshToken,
                    UserId = user.Id,
                    Name = user.Name
                }, "Đăng nhập thành công!")
                { RequireOtp = false });
            }

            // User chưa tồn tại → tạo mới
            if (user == null)
            {
                user = new User
                {
                    Name = request.Gmail.Split('@')[0],
                    Email = request.Gmail,
                    PasswordHash = "OTP_NO_PASSWORD",
                    Timezone = "Asia/Ho_Chi_Minh",
                    IsEmailVerified = false
                };
                _context.Users.Add(user);
            }

            // Gửi OTP
            var otp = GenerateOtp();
            user.OtpCode = otp;
            user.OtpExpiry = DateTime.UtcNow.AddMinutes(10);
            await _context.SaveChangesAsync();

            try
            {
                await SendOtpEmailAsync(user.Email, otp);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"=== Lỗi gửi OTP: {ex.Message} ===");
                return StatusCode(500, new ApiResponse<string>("Không thể gửi mã xác thực. Vui lòng thử lại."));
            }

            return Ok(new ApiResponse<object>(new { }, "Đã gửi mã OTP!") { RequireOtp = true });
        }

        [HttpPost("verify-otp")]
        public async System.Threading.Tasks.Task<IActionResult> VerifyOtp([FromBody] VerifyOtpDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Gmail);

            if (user == null)
                return BadRequest(new ApiResponse<string>("Tài khoản không tồn tại!"));

            if (string.IsNullOrEmpty(user.OtpCode) || user.OtpExpiry == null)
                return BadRequest(new ApiResponse<string>("Vui lòng yêu cầu mã OTP trước!"));

            if (user.OtpExpiry < DateTime.UtcNow)
                return BadRequest(new ApiResponse<string>("Mã OTP đã hết hạn!"));

            if (user.OtpCode != request.Otp)
                return BadRequest(new ApiResponse<string>("Mã xác thực không đúng hoặc đã hết hạn."));

            user.IsEmailVerified = true;
            user.OtpCode = null;
            user.OtpExpiry = null;

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();
            await _timeTrackingService.StartSessionAsync(user.Id);

            return Ok(new ApiResponse<AuthResponseDto>(new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                UserId = user.Id,
                Name = user.Name
            }, "Xác thực thành công!"));
        }

        [HttpPost("logout")]
        [Microsoft.AspNetCore.Authorization.Authorize]
        public async System.Threading.Tasks.Task<IActionResult> Logout()
        {
            var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiryTime = null;
                await _context.SaveChangesAsync();
            }

            await _timeTrackingService.EndSessionAsync(userId);

            return Ok(new ApiResponse<string>("Đăng xuất thành công!"));
        }

        private string GenerateOtp()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString();
        }

        private async System.Threading.Tasks.Task SendOtpEmailAsync(string toEmail, string otpCode)
        {
            var senderRefreshToken = _config["Google:SenderRefreshToken"]!;
            var accessToken = await _gmailService.GetNewAccessTokenAsync(senderRefreshToken);
            var html = $"<h2>Mã OTP của bạn là: {otpCode}</h2><p>Mã có hiệu lực trong 10 phút.</p>";
            await _gmailService.SendEmailAsync(accessToken, toEmail, "Mã xác thực OTP của bạn", html);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private string GenerateJwtToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name)
            };

            //Token sống được 7 ngày, sau đó cần refresh token để lấy access token mới
            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: creds
            );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class RegisterDto
    {
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class LoginDto
    {
        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class TokenDto
    {
        public string RefreshToken { get; set; } = null!;
    }

    public class AuthResponseDto
    {
        public string AccessToken { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
        public Guid UserId { get; set; }
        public string Name { get; set; } = null!;
    }

    public class TokenResponseDto
    {
        public string AccessToken { get; set; } = null!;
        public string RefreshToken { get; set; } = null!;
    }

    public class GoogleLoginDto
    {
        public string IdToken { get; set; } = null!;
        public string? GoogleRefreshToken { get; set; }
    }

    public class GoogleUserInfo
    {
        public string? Sub { get; set; }
        public string? Email { get; set; }
        public bool? EmailVerified { get; set; }
        public string? Name { get; set; }
        public string? Picture { get; set; }
    }
}