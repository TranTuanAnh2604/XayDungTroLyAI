using System.Net.Http.Headers;
using System.Text.Json;

namespace Assistant.Services
{
    public class GmailService
    {
        private readonly HttpClient _httpClient;
        private readonly string _clientId;
        private readonly string _clientSecret;

        // Dùng IConfiguration để ép C# tự mò vào file appsettings.json rút Key
        public GmailService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _clientId = config["Google:ClientId"]!;       // Đọc chính xác cụm Google -> ClientId
            _clientSecret = config["Google:ClientSecret"]!; // Đọc chính xác cụm Google -> ClientSecret
        }

        // 1. Dùng Refresh Token đổi lấy Access Token mới nhất từ Google
        public async Task<string> GetNewAccessTokenAsync(string googleRefreshToken)
        {
            var requestValues = new Dictionary<string, string>
            {
                { "client_id", _clientId }, // <--- Tự nạp mã đã giấu vào đây
                { "client_secret", _clientSecret }, // <--- Tự nạp mật mã đã giấu vào đây
                { "refresh_token", googleRefreshToken },
                { "grant_type", "refresh_token" }
            };

            var content = new FormUrlEncodedContent(requestValues);
            var response = await _httpClient.PostAsync("https://oauth2.googleapis.com/token", content);

            if (!response.IsSuccessStatusCode)
                throw new Exception("Không thể lấy Access Token từ Google. Có thể mã RefreshToken đã hết hạn.");

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            return doc.RootElement.GetProperty("access_token").GetString()!;
        }

        // 2. Kéo 5 Email mới nhất trong 24h qua (Giữ nguyên đoạn này của ông)
        public async Task<List<string>> GetRecentEmailsAsync(string accessToken)
        {
            var emailSnippets = new List<string>();
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await _httpClient.GetAsync("https://gmail.googleapis.com/v1/users/me/messages?maxResults=5&q=newer_than:1d");
            if (!response.IsSuccessStatusCode) return emailSnippets;

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);

            if (!doc.RootElement.TryGetProperty("messages", out var messagesProperty))
                return emailSnippets;

            foreach (var msg in messagesProperty.EnumerateArray())
            {
                string msgId = msg.GetProperty("id").GetString()!;
                var detailResponse = await _httpClient.GetAsync($"https://gmail.googleapis.com/v1/users/me/messages/{msgId}");
                if (detailResponse.IsSuccessStatusCode)
                {
                    var detailString = await detailResponse.Content.ReadAsStringAsync();
                    using var detailDoc = JsonDocument.Parse(detailString);
                    emailSnippets.Add(detailDoc.RootElement.GetProperty("snippet").GetString()!);
                }
            }
            return emailSnippets;
        }
    }
}