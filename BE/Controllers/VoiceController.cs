using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Assistant.Services;
using Assistant.Wrappers;
using Assistant.Models;
using System.Security.Claims;
using System.Text;
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
                // ── MỚI: Nạp context dữ liệu user (task, lịch, ghi nhớ) giống ChatController ──
                var userDataContext = await BuildUserDataContextAsync(userId, vnNow);

                var (reply, taskJson, calendarJson) = await _groqService.ChatWithIntentAsync(request.Text, userDataContext);

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

        // ═══════════════════════════════════════════════════════════════════
        // MỚI: HELPER XÂY DỰNG CONTEXT DỮ LIỆU USER (copy logic từ ChatController
        // để AI trong Voice cũng biết Task/Event/UserMemory, trả lời được câu hỏi
        // liên quan sở thích cá nhân, việc đang làm, lịch sắp tới...)
        // ═══════════════════════════════════════════════════════════════════

        private async Task<string> BuildUserDataContextAsync(Guid userId, DateTime vnNow)
        {
            var todayStart = vnNow.Date;
            var weekEnd = todayStart.AddDays(7);

            var tasks = await _db.Tasks
                .Where(t => t.UserId == userId && t.Status != "done")
                .OrderBy(t => t.DueDate ?? DateTime.MaxValue)
                .ThenByDescending(t => t.Priority)
                .Take(30)
                .ToListAsync();

            var events = await _db.CalendarEvents
                .Where(e => e.UserId == userId && e.StartTime >= todayStart && e.StartTime <= weekEnd)
                .OrderBy(e => e.StartTime)
                .Take(30)
                .ToListAsync();

            var memories = await _db.UserMemories
                .Where(m => m.UserId == userId && m.Category != "OAuth") // không lộ token nội bộ vào prompt
                .OrderByDescending(m => m.UpdatedAt)
                .Take(30)
                .ToListAsync();

            if (tasks.Count == 0 && events.Count == 0 && memories.Count == 0)
                return string.Empty;

            var sb = new StringBuilder();
            sb.AppendLine("=== DỮ LIỆU THỰC TẾ CỦA NGƯỜI DÙNG (chỉ dùng để trả lời, KHÔNG bịa thêm) ===");
            sb.AppendLine($"Hôm nay là: {vnNow:dd/MM/yyyy} ({GetVietnameseDayOfWeek(vnNow.DayOfWeek)}), giờ hiện tại: {vnNow:HH:mm}");

            if (tasks.Count > 0)
            {
                sb.AppendLine("\n-- Công việc (task) chưa hoàn thành --");
                foreach (var t in tasks)
                {
                    var due = t.DueDate.HasValue ? t.DueDate.Value.ToString("dd/MM/yyyy HH:mm") : "chưa có hạn";
                    var overdueFlag = (t.DueDate.HasValue && t.DueDate.Value < vnNow) ? " [QUÁ HẠN]" : "";
                    sb.AppendLine($"- \"{t.Title}\" | Hạn: {due}{overdueFlag} | Ưu tiên: {GetTaskPriorityLabel(t.Priority)} | Trạng thái: {t.Status}");
                }
            }

            if (events.Count > 0)
            {
                sb.AppendLine("\n-- Sự kiện lịch (7 ngày tới) --");
                foreach (var e in events)
                {
                    var time = e.IsAllDay
                        ? e.StartTime.ToString("dd/MM/yyyy") + " (cả ngày)"
                        : $"{e.StartTime:dd/MM/yyyy HH:mm} - {e.EndTime:HH:mm}";
                    var loc = string.IsNullOrWhiteSpace(e.Location) ? "" : $" | Địa điểm: {e.Location}";
                    sb.AppendLine($"- \"{e.Title}\" | {time} | Ưu tiên: {GetCalendarPriorityLabel(e.Priority)}{loc}");
                }
            }

            if (memories.Count > 0)
            {
                sb.AppendLine("\n-- Thông tin đã ghi nhớ về người dùng (sở thích, thói quen...) --");
                foreach (var m in memories)
                {
                    sb.AppendLine($"- {m.Category}/{m.Key}: {m.Value}");
                }
            }

            sb.AppendLine("=== HẾT DỮ LIỆU ===\n");
            return sb.ToString();
        }

        private static string GetTaskPriorityLabel(byte priority) => priority switch
        {
            3 => "Khẩn cấp",
            2 => "Bình thường",
            1 => "Thấp",
            _ => "Bình thường"
        };

        private static string GetCalendarPriorityLabel(int priority) => priority switch
        {
            0 => "Khẩn cấp",
            1 => "Bình thường",
            2 => "Thấp",
            _ => "Bình thường"
        };

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