using System.Net.Http.Json;
using System.Text;
using System.Text.Json.Serialization;

namespace Assistant.Services
{
    public class WebSearchService
    {
        private readonly HttpClient _http;
        private readonly string _apiKey;

        public WebSearchService(HttpClient http, IConfiguration config)
        {
            _http = http;
            _apiKey = config["Tavily:ApiKey"]
                ?? throw new Exception("Thiếu Tavily:ApiKey trong appsettings.json");
        }

        public async Task<string?> SearchAsync(string query)
        {
            var payload = new
            {
                api_key = _apiKey,
                query,
                search_depth = "basic",
                include_answer = true,
                max_results = 3
            };

            HttpResponseMessage res;
            try
            {
                res = await _http.PostAsJsonAsync("https://api.tavily.com/search", payload);
            }
            catch
            {
                return null;
            }

            if (!res.IsSuccessStatusCode) return null;

            var json = await res.Content.ReadFromJsonAsync<TavilyResponse>();
            if (json == null) return null;

            var sb = new StringBuilder();
            if (!string.IsNullOrWhiteSpace(json.Answer))
                sb.AppendLine($"Tóm tắt: {json.Answer}");

            if (json.Results != null)
                foreach (var r in json.Results.Take(3))
                    sb.AppendLine($"- {r.Title}: {r.Content}");

            return sb.Length > 0 ? sb.ToString() : null;
        }
    }

    public class TavilyResponse
    {
        [JsonPropertyName("answer")]
        public string? Answer { get; set; }
        [JsonPropertyName("results")]
        public List<TavilyResult>? Results { get; set; }
    }

    public class TavilyResult
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = "";
        [JsonPropertyName("content")]
        public string Content { get; set; } = "";
    }
}