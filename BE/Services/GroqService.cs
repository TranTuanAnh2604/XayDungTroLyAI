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
                model = "openai/gpt-oss-20b",
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "Bạn là một trợ lý AI. Luôn luôn trả lời bằng tiếng Việt, dù người dùng hỏi bằng ngôn ngữ nào. Trả lời ngắn gọn, tự nhiên, dễ hiểu."
                    },
                    new { role = "user", content = prompt }
                },
                temperature = 0.7,
                reasoning_effort = "low"
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

        // MỚI: thêm tham số userDataContext (optional) để AI đọc được Task/Event/UserMemory
        // của người dùng, phục vụ Voice/Chat trả lời được câu hỏi về sở thích cá nhân, lịch trình...
        public async Task<(string reply, string? taskJson, string? calendarJson)> ChatWithIntentAsync(string prompt, string? userDataContext = null)
        {
            string url = "https://api.groq.com/openai/v1/chat/completions";

            // Dùng giờ VN chuẩn (UtcNow + 7h) thay vì DateTime.Now (giờ server, không đảm bảo đúng VN)
            var now = DateTime.UtcNow.AddHours(7);

            var systemPromptBuilder = new StringBuilder();
            systemPromptBuilder.Append(
                "Bạn là trợ lý AI thông minh. Luôn trả lời bằng tiếng Việt, ngắn gọn, tự nhiên.\n\n" +
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
                "- Luôn dùng múi giờ +07:00 khi xuất ISO 8601\n\n");

            // ── MỚI: Chèn dữ liệu cá nhân hoá (task, lịch, ghi nhớ) nếu có ──
            if (!string.IsNullOrWhiteSpace(userDataContext))
            {
                systemPromptBuilder.Append(
                    "=== DỮ LIỆU CÁ NHÂN HOÁ NGƯỜI DÙNG ===\n" +
                    userDataContext + "\n" +
                    "Nếu người dùng hỏi về sở thích, thói quen, công việc hoặc lịch trình đã có ở trên, " +
                    "hãy dùng đúng dữ liệu này để trả lời (điền vào trường \"reply\"). " +
                    "KHÔNG bịa thêm thông tin không có trong dữ liệu trên.\n\n");
            }

            systemPromptBuilder.Append(
                "=== QUY TẮC PHÂN LOẠI ===\n" +
                "- LUÔN LUÔN tạo cả task lẫn calendarEvent cho mọi công việc, lịch hẹn, nhắc nhở\n" +
                "- task.title = nội dung công việc ngắn gọn\n" +
                "- calendarEvent.title = giống task.title\n" +
                "- Nếu không có giờ cụ thể → startTime = ngày đó lúc 08:00, endTime = 09:00\n" +
                "- Nếu không có ngày cụ thể → dùng ngày mai\n" +
                "- Chỉ trả task: null, calendarEvent: null khi là câu hỏi thông thường không liên quan đến công việc " +
                "(ví dụ hỏi về sở thích, chào hỏi, trò chuyện thường)\n\n" +
                "=== FORMAT JSON BẮT BUỘC (KHÔNG thêm text nào ngoài JSON) ===\n" +
                "{\n" +
                "  \"reply\": \"câu trả lời tự nhiên xác nhận những gì đã tạo, hoặc trả lời câu hỏi của người dùng\",\n" +
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
                "priority: 1=thấp, 2=bình thường, 3=khẩn cấp");

            var systemPrompt = systemPromptBuilder.ToString();

            var requestBody = new
            {
                model = "openai/gpt-oss-20b",
                messages = new[]
                {
            new { role = "system", content = systemPrompt },
            new { role = "user", content = prompt }
        },
                temperature = 0.3,
                reasoning_effort = "low"
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
                model = "openai/gpt-oss-20b",
                messages = new[]
                {
            new { role = "system", content = systemPrompt },
            new { role = "user", content = trimmedText }
        },
                temperature = 0.2,
                reasoning_effort = "low"
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

        public async Task<string> ChatWithToolsAsync(string systemPrompt, string userPrompt, WebSearchService webSearchService)
        {
            string url = "https://api.groq.com/openai/v1/chat/completions";

            var tools = new object[]
            {
        new
        {
            type = "function",
            function = new
            {
                name = "web_search",
                description = "Tìm kiếm thông tin mới nhất trên Internet (thời tiết, tin tức, giá cả, sự kiện hiện tại, hoặc bất kỳ thông tin cần cập nhật real-time). CHỈ dùng khi câu hỏi thực sự cần thông tin mới, không dùng cho câu hỏi thông thường hoặc dữ liệu cá nhân đã có sẵn.",
                parameters = new
                {
                    type = "object",
                    properties = new
                    {
                        query = new
                        {
                            type = "string",
                            description = "Từ khóa tìm kiếm ngắn gọn, rõ nghĩa"
                        }
                    },
                    required = new[] { "query" }
                }
            }
        }
            };

            var messages = new List<object>
    {
        new { role = "system", content = systemPrompt },
        new { role = "user", content = userPrompt }
    };

            // Lượt 1: cho AI quyền tự quyết có cần gọi tool không
            var firstRequest = new
            {
                model = "openai/gpt-oss-20b",
                messages,
                tools,
                tool_choice = "auto",
                temperature = 0.3,
                reasoning_effort = "low"
            };

            var firstRes = await _httpClient.PostAsync(url,
    new StringContent(JsonSerializer.Serialize(firstRequest), Encoding.UTF8, "application/json"));
            var firstStr = await firstRes.Content.ReadAsStringAsync();

            if (!firstRes.IsSuccessStatusCode)
            {
                // Model ảo giác gọi tool không tồn tại (vd tự bịa "create_task") -> fallback: gọi lại KHÔNG kèm tools
                if (firstStr.Contains("tool_use_failed") || firstStr.Contains("tool call validation failed"))
                {
                    var fallbackRequest = new
                    {
                        model = "openai/gpt-oss-20b",
                        messages,
                        temperature = 0.3,
                        reasoning_effort = "low"
                    };
                    var fallbackRes = await _httpClient.PostAsync(url,
                        new StringContent(JsonSerializer.Serialize(fallbackRequest), Encoding.UTF8, "application/json"));
                    var fallbackStr = await fallbackRes.Content.ReadAsStringAsync();
                    if (!fallbackRes.IsSuccessStatusCode)
                        throw new Exception($"Lỗi từ Groq (fallback): {fallbackStr}");

                    return JsonNode.Parse(fallbackStr)?["choices"]?[0]?["message"]?["content"]?.ToString()
                        ?? "AI không có phản hồi.";
                }

                throw new Exception($"Lỗi từ Groq: {firstStr}");
            }

            var firstMessage = JsonNode.Parse(firstStr)?["choices"]?[0]?["message"];
            var toolCalls = firstMessage?["tool_calls"]?.AsArray();

            // AI không cần search -> trả lời luôn
            if (toolCalls == null || toolCalls.Count == 0)
                return firstMessage?["content"]?.ToString() ?? "AI không có phản hồi.";

            // AI muốn gọi tool -> ghi lại message assistant kèm tool_calls
            messages.Add(new
            {
                role = "assistant",
                content = firstMessage?["content"]?.ToString(),
                tool_calls = JsonNode.Parse(toolCalls.ToJsonString())
            });

            // Thực thi từng tool_call thật sự
            foreach (var call in toolCalls)
            {
                var toolCallId = call?["id"]?.ToString() ?? "";
                var funcName = call?["function"]?["name"]?.ToString();
                var argsRaw = call?["function"]?["arguments"]?.ToString() ?? "{}";

                string toolResultText = "Không tìm được kết quả.";
                if (funcName == "web_search")
                {
                    try
                    {
                        var query = JsonNode.Parse(argsRaw)?["query"]?.ToString() ?? "";
                        var result = await webSearchService.SearchAsync(query);
                        toolResultText = result ?? "Không tìm thấy kết quả liên quan, trả lời dựa trên kiến thức sẵn có.";
                    }
                    catch
                    {
                        toolResultText = "Lỗi khi tìm kiếm, hãy trả lời dựa trên kiến thức sẵn có.";
                    }
                }

                messages.Add(new { role = "tool", tool_call_id = toolCallId, content = toolResultText });
            }

            // Lượt 2: AI đọc kết quả search thật rồi trả lời cuối cùng
            var secondRequest = new
            {
                model = "openai/gpt-oss-20b",
                messages,
                temperature = 0.3,
                max_completion_tokens = 2048,
                reasoning_effort = "low",
                response_format = new { type = "json_object" }
            };
            var secondRes = await _httpClient.PostAsync(url,
                new StringContent(JsonSerializer.Serialize(secondRequest), Encoding.UTF8, "application/json"));
            var secondStr = await secondRes.Content.ReadAsStringAsync();
            if (!secondRes.IsSuccessStatusCode)
                throw new Exception($"Lỗi từ Groq (lượt 2): {secondStr}");

            return JsonNode.Parse(secondStr)?["choices"]?[0]?["message"]?["content"]?.ToString()
                ?? "AI không có phản hồi.";
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