using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Assistant.Services;
using Assistant.Wrappers;
using Assistant.Models;
using System.Security.Claims;
using System.Text.Json;
using System.Text.Json.Nodes;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VoiceController : ControllerBase
    {
        private readonly GroqService _groqService;
        private readonly AppDbContext _db;

        public VoiceController(GroqService groqService, AppDbContext db)
        {
            _groqService = groqService;
            _db = db;
        }

        [HttpPost("process")]
        public async Task<IActionResult> ProcessVoice([FromBody] VoiceRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
                return BadRequest(new ApiResponse<string>("Không nhận được nội dung giọng nói!"));

            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            // Giờ VN hiện tại, dùng chung cho mọi CreatedAt trong action này
            var vnNow = DateTime.UtcNow.AddHours(7);

            try
            {
                var (reply, taskJson, calendarJson) = await _groqService.ChatWithIntentAsync(request.Text);

                Guid? createdTaskId = null;
                Guid? createdEventId = null;

                // ── Tạo Task nếu có ──────────────────────────────────────────
                if (!string.IsNullOrEmpty(taskJson) && taskJson != "null")
                {
                    try
                    {
                        var node = JsonNode.Parse(taskJson);
                        var title = node?["title"]?.ToString();

                        Console.WriteLine($"[VOICE] taskJson = {taskJson}");
                        Console.WriteLine($"[VOICE] title = {title}");

                        if (!string.IsNullOrWhiteSpace(title))
                        {
                            var dueDateStr = node?["dueDate"]?.ToString();
                            var priorityStr = node?["priority"]?.ToString();
                            byte priority = byte.TryParse(priorityStr, out var p) ? p : (byte)2;

                            // AI trả về giờ VN (wall-clock) -> chỉ gắn nhãn Utc, KHÔNG convert
                            DateTime? dueDate = null;
                            if (!string.IsNullOrEmpty(dueDateStr) && DateTime.TryParse(dueDateStr, out var pd))
                            {
                                dueDate = DateTime.SpecifyKind(pd, DateTimeKind.Utc);
                            }

                            var task = new Assistant.Models.Task
                            {
                                Id = Guid.NewGuid(),
                                UserId = userId,
                                Title = title,
                                Description = node?["description"]?.ToString(),
                                DueDate = dueDate,
                                Priority = priority,
                                Status = "pending",
                                InputMethod = "voice",
                                CreatedAt = vnNow
                            };
                            _db.Tasks.Add(task);
                            await _db.SaveChangesAsync();
                            createdTaskId = task.Id;
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[VOICE] Task error: {ex.Message}");
                    }
                }

                // ── Tạo Calendar Event nếu có ─────────────────────────────────
                if (!string.IsNullOrEmpty(calendarJson) && calendarJson != "null")
                {
                    Console.WriteLine($"[VOICE] calendarJson = {calendarJson}");
                    try
                    {
                        var node = JsonNode.Parse(calendarJson);
                        var title = node?["title"]?.ToString();
                        var startStr = node?["startTime"]?.ToString();

                        if (!string.IsNullOrWhiteSpace(title) && !string.IsNullOrWhiteSpace(startStr)
                            && DateTime.TryParse(startStr, out var startTime))
                        {
                            var endStr = node?["endTime"]?.ToString();
                            DateTime endTime = DateTime.TryParse(endStr, out var et)
                                ? et
                                : startTime.AddHours(1); // mặc định +1h

                            var calEvent = new CalendarEvent
                            {
                                Id = Guid.NewGuid(),
                                UserId = userId,
                                Title = title,
                                Description = node?["description"]?.ToString(),
                                Location = node?["location"]?.ToString(),
                                // AI trả về giờ VN (wall-clock) -> chỉ gắn nhãn Utc, KHÔNG convert
                                StartTime = DateTime.SpecifyKind(startTime, DateTimeKind.Utc),
                                EndTime = DateTime.SpecifyKind(endTime, DateTimeKind.Utc),
                                IsAllDay = node?["isAllDay"]?.GetValue<bool>() ?? false,
                                Source = "voice",
                                CreatedAt = vnNow
                            };
                            _db.CalendarEvents.Add(calEvent);
                            await _db.SaveChangesAsync();
                            createdEventId = calEvent.Id;
                        }
                    }
                    catch { }
                }

                return Ok(new ApiResponse<VoiceProcessResult>(new VoiceProcessResult
                {
                    Reply = reply,
                    TaskCreated = createdTaskId.HasValue,
                    TaskId = createdTaskId,
                    CalendarEventCreated = createdEventId.HasValue,
                    CalendarEventId = createdEventId
                }, "AI đã phản hồi!"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi xử lý AI: {ex.Message}"));
            }
        }

        [HttpPost("save")]
        public async Task<IActionResult> SaveTranscript([FromBody] SaveTranscriptDto request)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(userIdStr, out var userId))
                return Unauthorized();

            var record = new VoiceTranscript
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Transcript = request.Transcript,
                AiResponse = request.AiResponse,
                CreatedAt = DateTime.UtcNow.AddHours(7) // giờ VN, khớp convention toàn project
            };

            _db.VoiceTranscripts.Add(record);
            await _db.SaveChangesAsync();

            return Ok(new ApiResponse<object>(new { id = record.Id }, "Đã lưu transcript!"));
        }
    }

    public class VoiceRequestDto { public string Text { get; set; } = null!; }
    public class SaveTranscriptDto
    {
        public string Transcript { get; set; } = null!;
        public string? AiResponse { get; set; }
    }
    public class VoiceProcessResult
    {
        public string Reply { get; set; } = null!;
        public bool TaskCreated { get; set; }
        public Guid? TaskId { get; set; }
        public bool CalendarEventCreated { get; set; }
        public Guid? CalendarEventId { get; set; }
    }
}