using System.Net.Http.Headers;
using System.Text.Json;
using Assistant.DTOs;

namespace Assistant.Services
{
    public class GmailService
    {
        private readonly HttpClient _httpClient;
        private readonly string _clientId;
        private readonly string _clientSecret;

        public GmailService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _clientId = config["Google:ClientId"]!;
            _clientSecret = config["Google:ClientSecret"]!;
        }

        // 1. Đổi Refresh Token lấy Access Token
        public async Task<string> GetNewAccessTokenAsync(string googleRefreshToken)
        {
            // ✅ Dùng HttpClient mới để tránh conflict header Authorization
            using var client = new HttpClient();
            var requestValues = new Dictionary<string, string>
            {
                { "client_id", _clientId },
                { "client_secret", _clientSecret },
                { "refresh_token", googleRefreshToken },
                { "grant_type", "refresh_token" }
            };

            var response = await client.PostAsync(
                "https://oauth2.googleapis.com/token",
                new FormUrlEncodedContent(requestValues));

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"=== Lỗi lấy Access Token: {err} ===");
                throw new Exception("Không thể lấy Access Token từ Google.");
            }

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);
            return doc.RootElement.GetProperty("access_token").GetString()!;
        }

        // 2. Kéo gmail mới nhất trong 24h (dùng cho auto-sync)
        public async Task<List<string>> GetRecentGmailsAsync(string accessToken)
        {
            var gmailSnippets = new List<string>();
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            // ✅ Sửa URL đúng
            var response = await client.GetAsync(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=newer_than:1d");
            if (!response.IsSuccessStatusCode) return gmailSnippets;

            var responseString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(responseString);

            if (!doc.RootElement.TryGetProperty("messages", out var messagesProperty))
                return gmailSnippets;

            foreach (var msg in messagesProperty.EnumerateArray())
            {
                string msgId = msg.GetProperty("id").GetString()!;
                var detailResponse = await client.GetAsync(
                    $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msgId}");
                if (detailResponse.IsSuccessStatusCode)
                {
                    var detailString = await detailResponse.Content.ReadAsStringAsync();
                    using var detailDoc = JsonDocument.Parse(detailString);
                    gmailSnippets.Add(detailDoc.RootElement.GetProperty("snippet").GetString()!);
                }
            }
            return gmailSnippets;
        }

        // 3. Lấy danh sách gmail inbox
        public async Task<List<GmailDto>> GetInboxGmailsAsync(string accessToken, int maxResults = 10)
        {
            var result = new List<GmailDto>();
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var listRes = await client.GetAsync(
                $"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={maxResults}&labelIds=INBOX");

            var listStr = await listRes.Content.ReadAsStringAsync();
            Console.WriteLine($"=== Gmail API Status: {listRes.StatusCode} ===");
            Console.WriteLine($"=== Gmail API Response: {listStr.Substring(0, Math.Min(500, listStr.Length))} ===");

            if (!listRes.IsSuccessStatusCode) return result;

            using var listDoc = JsonDocument.Parse(listStr);

            if (!listDoc.RootElement.TryGetProperty("messages", out var messages))
            {
                Console.WriteLine("=== KHÔNG CÓ MESSAGES TRONG RESPONSE ===");
                return result;
            }

            Console.WriteLine($"=== Tìm thấy {messages.GetArrayLength()} gmails ===");

            {
                var msgId = msg.GetProperty("id").GetString()!;
                var detailRes = await client.GetAsync(
                    $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msgId}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date");

                if (!detailRes.IsSuccessStatusCode) continue;

                var detailStr = await detailRes.Content.ReadAsStringAsync();

                using (var detailDoc = JsonDocument.Parse(detailStr))
                {
                    var root = detailDoc.RootElement;
                    var headers = root.GetProperty("payload").GetProperty("headers");

                    var labelIds = root.TryGetProperty("labelIds", out var labels)
                        ? labels.EnumerateArray().Select(l => l.GetString()).ToList()
                        : new List<string?>();

                    result.Add(new GmailDto
                    {
                        Id = msgId,
                        From = GetHeader(headers, "From"),
                        Subject = GetHeader(headers, "Subject"),
                        Snippet = root.GetProperty("snippet").GetString() ?? "",
                        Date = GetHeader(headers, "Date"),
                        IsUnread = labelIds.Contains("UNREAD")
                    });
                }
            }

            return result;
        }

        // 4. Lấy chi tiết 1 gmail
        public async Task<GmailDetailDto> GetGmailDetailAsync(string accessToken, string messageId)
        {
            using var client = new HttpClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var res = await client.GetAsync(
                $"https://gmail.googleapis.com/gmail/v1/users/me/messages/{messageId}?format=full");

            if (!res.IsSuccessStatusCode) throw new Exception("Không lấy được gmail.");

            var str = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(str);
            var root = doc.RootElement;
            var headers = root.GetProperty("payload").GetProperty("headers");

            var labelIds = root.TryGetProperty("labelIds", out var labels)
                ? labels.EnumerateArray().Select(l => l.GetString()).ToList()
                : new List<string?>();

            var bodyText = "";
            var bodyHtml = "";
            var payload = root.GetProperty("payload");

            if (payload.TryGetProperty("parts", out var parts))
            {
                ExtractBodyParts(parts, ref bodyText, ref bodyHtml);
            }
            else if (payload.TryGetProperty("body", out var directBody)
                     && directBody.TryGetProperty("data", out var directData))
            {
                var mime = payload.GetProperty("mimeType").GetString();
                var decoded = DecodeBase64Url(directData.GetString() ?? "");
                if (mime == "text/html") bodyHtml = decoded;
                else bodyText = decoded;
            }

            return new GmailDetailDto
            {
                Id = messageId,
                From = GetHeader(headers, "From"),
                To = GetHeader(headers, "To"),
                Subject = GetHeader(headers, "Subject"),
                Snippet = root.GetProperty("snippet").GetString() ?? "",
                Date = GetHeader(headers, "Date"),
                IsUnread = labelIds.Contains("UNREAD"),
                Body = bodyText,
                BodyHtml = bodyHtml
            };
        }

        // Helper đọc header
        private string GetHeader(JsonElement headers, string name)
        {
            foreach (var h in headers.EnumerateArray())
            {
                if (h.GetProperty("name").GetString()?.Equals(name, StringComparison.OrdinalIgnoreCase) == true)
                    return h.GetProperty("value").GetString() ?? "";
            }
            return "";
        }

        // Helper decode base64url
        private string DecodeBase64Url(string base64Url)
        {
            if (string.IsNullOrEmpty(base64Url)) return "";
            var base64 = base64Url.Replace('-', '+').Replace('_', '/');
            var pad = base64.Length % 4;
            if (pad > 0) base64 += new string('=', 4 - pad);
            try { return System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(base64)); }
            catch { return ""; }
        }

        // Helper đệ quy xử lý multipart
        private void ExtractBodyParts(JsonElement parts, ref string bodyText, ref string bodyHtml)
        {
            foreach (var part in parts.EnumerateArray())
            {
                var mime = part.GetProperty("mimeType").GetString();

                if (mime != null && mime.StartsWith("multipart") && part.TryGetProperty("parts", out var subParts))
                {
                    ExtractBodyParts(subParts, ref bodyText, ref bodyHtml);
                    continue;
                }

                if (part.TryGetProperty("body", out var body) && body.TryGetProperty("data", out var data))
                {
                    var decoded = DecodeBase64Url(data.GetString() ?? "");
                    if (mime == "text/html") bodyHtml = decoded;
                    else if (mime == "text/plain" && string.IsNullOrEmpty(bodyText)) bodyText = decoded;
                }
            }
        }
    }
}