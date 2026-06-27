using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;

namespace Assistant.Services
{
    public class GroqService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GroqService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["Groq:ApiKey"] ?? throw new ArgumentNullException("Thiếu Groq API Key trong config!");

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        public async Task<string> ChatAsync(string prompt)
        {
            string url = "https://api.groq.com/openai/v1/chat/completions";
            var requestBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "Bạn là một trợ lý AI. Luôn luôn trả lời bằng tiếng Việt, dù người dùng hỏi bằng ngôn ngữ nào. Trả lời ngắn gọn, tự nhiên, dễ hiểu."
                    },
                    new { role = "user", content = prompt }
                },
                temperature = 0.7
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Lỗi từ hệ thống Groq: {responseString}");
            }

            var jsonNode = JsonNode.Parse(responseString);
            var replyText = jsonNode?["choices"]?[0]?["message"]?["content"]?.ToString();

            return replyText ?? "AI không có phản hồi.";
        }

        public async Task<(string reply, string? taskJson)> ChatWithIntentAsync(string prompt)
        {
            string url = "https://api.groq.com/openai/v1/chat/completions";

            var systemPrompt = "Bạn là trợ lý AI. Luôn trả lời bằng tiếng Việt, ngắn gọn, tự nhiên.\n\n" +
                "Nếu người dùng đề cập đến một công việc, lịch hẹn, cuộc họp, deadline, " +
                "nhiệm vụ cần làm → hãy trả lời JSON theo format sau (KHÔNG kèm text nào khác):\n" +
                "{\n" +
                "  \"reply\": \"câu trả lời tự nhiên cho người dùng\",\n" +
                "  \"task\": {\n" +
                "    \"title\": \"tên task ngắn gọn\",\n" +
                "    \"description\": \"mô tả chi tiết hoặc null\",\n" +
                "    \"dueDate\": \"ISO 8601 hoặc null, múi giờ +07:00\",\n" +
                "    \"priority\": 2\n" +
                "  }\n" +
                "}\n\n" +
                "Nếu KHÔNG liên quan đến task → trả về:\n" +
                "{\n" +
                "  \"reply\": \"câu trả lời tự nhiên\",\n" +
                "  \"task\": null\n" +
                "}\n\n" +
                "Quy tắc priority: 1=thấp, 2=bình thường, 3=khẩn cấp.\n" +
                "Hôm nay là: " + DateTime.Now.ToString("yyyy-MM-dd HH:mm") + " (UTC+7).";

            var requestBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
            new { role = "system", content = systemPrompt },
            new { role = "user", content = prompt }
        },
                temperature = 0.3
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Lỗi từ Groq: {responseString}");

            var jsonNode = JsonNode.Parse(responseString);
            var replyText = jsonNode?["choices"]?[0]?["message"]?["content"]?.ToString();
            if (replyText == null) return ("AI không có phản hồi.", null);

            try
            {
                var parsed = JsonNode.Parse(replyText);
                var taskJson = parsed?["task"]?.ToJsonString();
                var reply = parsed?["reply"]?.ToString() ?? replyText;
                return (reply, taskJson);
            }
            catch
            {
                return (replyText, null);
            }
        }
    }
}