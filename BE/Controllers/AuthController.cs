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

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;

        public AuthController(AppDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _config = config;
            _httpClient = httpClientFactory.CreateClient();
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return BadRequest(new ApiResponse<string>("Email đã được sử dụng!"));
            }

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
        public async Task<IActionResult> Login([FromBody] LoginDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return Unauthorized(new ApiResponse<string>("Sai email hoặc mật khẩu!"));

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            var responseData = new AuthResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                UserId = user.Id,
                Name = user.Name
            };

            return Ok(new ApiResponse<AuthResponseDto>(responseData, "Đăng nhập thành công!"));
        }

        [HttpPost("google-login")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginDto request)
        {
            if (string.IsNullOrWhiteSpace(request.IdToken))
                return BadRequest(new ApiResponse<string>("Thiếu code từ Google!"));

            string googleAccessToken;
            string? googleRefreshToken = null;

            try
            {
                // Đổi authorization code lấy access_token + refresh_token
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

                // refresh_token chỉ có lần đầu hoặc khi prompt=consent
                if (tokenDoc.RootElement.TryGetProperty("refresh_token", out var rt))
                    googleRefreshToken = rt.GetString();
            }
            catch
            {
                return Unauthorized(new ApiResponse<string>("Đổi code thất bại!"));
            }

            // Lấy thông tin user từ Google
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

            // Tạo hoặc lấy user
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == googleUser.Email);
            if (user == null)
            {
                user = new User
                {
                    Name = googleUser.Name ?? "Google User",
                    Email = googleUser.Email,
                    PasswordHash = "GOOGLE_SSO_NO_PASSWORD",
                    Timezone = "Asia/Ho_Chi_Minh"
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();
            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            await _context.SaveChangesAsync();

            // ✅ Lưu Google Refresh Token nếu có
            if (!string.IsNullOrWhiteSpace(googleRefreshToken))
            {
                var existingToken = await _context.UserMemories
                    .FirstOrDefaultAsync(m => m.UserId == user.Id && m.Category == "OAuth" && m.Key == "Google_RefreshToken");

                if (existingToken != null)
                {
                    existingToken.Value = googleRefreshToken;
                    existingToken.UpdatedAt = DateTime.UtcNow;
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
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                await _context.SaveChangesAsync();
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
        public async Task<IActionResult> RefreshToken([FromBody] TokenDto tokenModel)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == tokenModel.RefreshToken);

            if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
                return Unauthorized(new ApiResponse<string>("Token không hợp lệ hoặc đã hết hạn!"));

            var newAccessToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;

            await _context.SaveChangesAsync();

            var responseData = new TokenResponseDto
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken
            };

            return Ok(new ApiResponse<TokenResponseDto>(responseData, "Làm mới Token thành công!"));
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
                new Claim(ClaimTypes.NameIdentifier,user.Id.ToString()),
                new Claim(ClaimTypes.Email,user.Email),
                new Claim (ClaimTypes.Name,user.Name)
            };

            var token = new JwtSecurityToken(
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
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

    // IdToken giờ thực chất chứa access_token từ useGoogleLogin
    public class GoogleLoginDto
    {
        public string IdToken { get; set; } = null!;
        public string? GoogleRefreshToken { get; set; }
    }

    // Cấu trúc JSON trả về từ https://www.googleapis.com/oauth2/v3/userinfo
    public class GoogleUserInfo
    {
        public string? Sub { get; set; }
        public string? Email { get; set; }
        public bool? EmailVerified { get; set; }
        public string? Name { get; set; }
        public string? Picture { get; set; }
    }
}