using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Linq;
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

        public async Task<(string reply, string? taskJson, string? calendarJson)> ChatWithIntentAsync(string prompt)
        {
            string url = "https://api.groq.com/openai/v1/chat/completions";

            var now = DateTime.Now;
            var systemPrompt = "Bạn là trợ lý AI thông minh. Luôn trả lời bằng tiếng Việt, ngắn gọn, tự nhiên.\n\n" +
                "=== THÔNG TIN THỜI GIAN HIỆN TẠI ===\n" +
                $"- Ngày giờ hiện tại: {now:yyyy-MM-dd HH:mm} (UTC+7)\n" +
                $"- Thứ trong tuần: {GetVietnameseDayOfWeek(now.DayOfWeek)}\n" +
                $"- Ngày: {now.Day}, Tháng: {now.Month}, Năm: {now.Year}\n" +
                $"- Ngày mai: {now.AddDays(1):yyyy-MM-dd} ({GetVietnameseDayOfWeek(now.AddDays(1).DayOfWeek)})\n" +
                $"- Tuần này: {now.AddDays(-(int)now.DayOfWeek + 1):yyyy-MM-dd} đến {now.AddDays(7 - (int)now.DayOfWeek):yyyy-MM-dd}\n\n" +
                "=== QUY TẮC PHÂN TÍCH THỜI GIAN ===\n" +
                "- 'sáng' = 08:00, 'trưa' = 12:00, 'chiều' = 14:00, 'tối' = 19:00 nếu không nói rõ giờ\n" +
                "- '7h', '7 giờ' = 07:00; '7h30' = 07:30; '7h tối' = 19:00\n" +
                "- 'ngày mai' = " + now.AddDays(1).ToString("yyyy-MM-dd") + "\n" +
                "- 'tuần sau' = ngày tương ứng của tuần sau\n" +
                "- 'thứ 2' = thứ Hai tuần này hoặc tuần sau nếu đã qua\n" +
                "- 'cuối tuần' = thứ Bảy " + now.AddDays(6 - (int)now.DayOfWeek).ToString("yyyy-MM-dd") + "\n" +
                "- Nếu không rõ ngày → dùng ngày mai\n" +
                "- Nếu không rõ giờ → dùng 08:00\n" +
                "- Thời gian kết thúc mặc định = bắt đầu + 1 giờ\n" +
                "- Luôn dùng múi giờ +07:00 khi xuất ISO 8601\n\n" +
                "=== QUY TẮC PHÂN LOẠI ===\n" +
                "- LUÔN LUÔN tạo cả task lẫn calendarEvent cho mọi công việc, lịch hẹn, nhắc nhở\n" +
                "- task.title = nội dung công việc ngắn gọn\n" +
                "- calendarEvent.title = giống task.title\n" +
                "- Nếu không có giờ cụ thể → startTime = ngày đó lúc 08:00, endTime = 09:00\n" +
                "- Nếu không có ngày cụ thể → dùng ngày mai\n" +
                "- Chỉ trả task: null, calendarEvent: null khi là câu hỏi thông thường không liên quan đến công việc\n\n" +
                "=== FORMAT JSON BẮT BUỘC (KHÔNG thêm text nào ngoài JSON) ===\n" +
                "{\n" +
                "  \"reply\": \"câu trả lời tự nhiên xác nhận những gì đã tạo\",\n" +
                "  \"task\": null,\n" +
                "  \"calendarEvent\": null\n" +
                "}\n\n" +
                "Khi có task:\n" +
                "  \"task\": {\n" +
                "    \"title\": \"tên task ngắn gọn\",\n" +
                "    \"description\": \"mô tả chi tiết hoặc null\",\n" +
                "    \"dueDate\": \"2025-06-15T07:00:00+07:00\",\n" +
                "    \"priority\": 2\n" +
                "  }\n\n" +
                "Khi có calendarEvent:\n" +
                "  \"calendarEvent\": {\n" +
                "    \"title\": \"tên sự kiện\",\n" +
                "    \"description\": \"mô tả hoặc null\",\n" +
                "    \"location\": \"địa điểm hoặc null\",\n" +
                "    \"startTime\": \"2025-06-15T07:00:00+07:00\",\n" +
                "    \"endTime\": \"2025-06-15T08:00:00+07:00\",\n" +
                "    \"isAllDay\": false\n" +
                "  }\n\n" +
                "priority: 1=thấp, 2=bình thường, 3=khẩn cấp";

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
            if (replyText == null) return ("AI không có phản hồi.", null, null);

            try
            {
                var parsed = JsonNode.Parse(replyText);
                var taskJson = parsed?["task"]?.ToJsonString();
                var calendarJson = parsed?["calendarEvent"]?.ToJsonString();
                var reply = parsed?["reply"]?.ToString() ?? replyText;
                return (reply, taskJson, calendarJson);
            }
            catch
            {
                return (replyText, null, null);
            }
        }

        public async Task<List<(string Category, string Key, string Value)>> ExtractMemoriesAsync(string rawText)
        {
            string url = "https://api.groq.com/openai/v1/chat/completions";

            var systemPrompt =
                "Bạn là một hệ thống trích xuất thông tin. Nhiệm vụ: đọc đoạn văn bản người dùng cung cấp " +
                "(có thể là ghi chú về sở thích, tính cách, thói quen của bản thân, sếp, đồng nghiệp, bạn bè...) " +
                "và tách thành các mục thông tin rời rạc.\n\n" +
                "QUY TẮC:\n" +
                "- Mỗi mục gồm 3 phần: category (chủ thể được nhắc tới, VD: \"Sếp - Nguyễn Văn A\", \"Bản thân\", \"Đồng nghiệp - Chị Lan\"), " +
                "key (loại thông tin ngắn gọn, VD: \"Sở thích đồ uống\", \"Tính cách\", \"Ngày sinh\"), " +
                "value (nội dung cụ thể, VD: \"Thích cà phê đen không đường, ghét trà sữa\").\n" +
                "- Chỉ trích xuất thông tin CÓ THẬT trong văn bản, KHÔNG suy diễn hay bịa thêm.\n" +
                "- Nếu văn bản không chứa thông tin nào hữu ích, trả về mảng rỗng [].\n\n" +
                "CHỈ trả về JSON, không thêm text nào khác, theo đúng format:\n" +
                "[{\"category\": \"...\", \"key\": \"...\", \"value\": \"...\"}]";

            // Giới hạn độ dài để tránh tốn quá nhiều token / vượt context model
            var trimmedText = rawText.Length > 6000 ? rawText.Substring(0, 6000) : rawText;

            var requestBody = new
            {
                model = "llama-3.1-8b-instant",
                messages = new[]
                {
            new { role = "system", content = systemPrompt },
            new { role = "user", content = trimmedText }
        },
                temperature = 0.2
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                throw new Exception($"Lỗi từ Groq: {responseString}");

            var jsonNode = JsonNode.Parse(responseString);
            var replyText = jsonNode?["choices"]?[0]?["message"]?["content"]?.ToString();

            if (string.IsNullOrWhiteSpace(replyText))
                return new List<(string, string, string)>();

            // Groq đôi khi bọc JSON trong ```json ... ``` dù đã dặn không làm vậy — dọn lại cho chắc
            var cleaned = replyText.Trim();
            if (cleaned.StartsWith("```"))
            {
                cleaned = cleaned.Trim('`');
                if (cleaned.StartsWith("json"))
                    cleaned = cleaned.Substring(4);
                cleaned = cleaned.Trim();
            }

            try
            {
                var array = JsonNode.Parse(cleaned)?.AsArray();
                var result = new List<(string, string, string)>();
                if (array != null)
                {
                    foreach (var item in array)
                    {
                        var category = item?["category"]?.ToString();
                        var key = item?["key"]?.ToString();
                        var value = item?["value"]?.ToString();
                        if (!string.IsNullOrWhiteSpace(category) && !string.IsNullOrWhiteSpace(key) && !string.IsNullOrWhiteSpace(value))
                        {
                            result.Add((category!, key!, value!));
                        }
                    }
                }
                return result;
            }
            catch
            {
                // AI trả về JSON lỗi format → coi như không trích xuất được gì, không làm sập request
                return new List<(string, string, string)>();
            }
        }

        private static string GetVietnameseDayOfWeek(DayOfWeek day) => day switch
        {
            DayOfWeek.Monday => "Thứ Hai",
            DayOfWeek.Tuesday => "Thứ Ba",
            DayOfWeek.Wednesday => "Thứ Tư",
            DayOfWeek.Thursday => "Thứ Năm",
            DayOfWeek.Friday => "Thứ Sáu",
            DayOfWeek.Saturday => "Thứ Bảy",
            DayOfWeek.Sunday => "Chủ Nhật",
            _ => ""
        };
    }
}