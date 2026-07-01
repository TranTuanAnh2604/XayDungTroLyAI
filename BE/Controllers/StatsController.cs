using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Assistant.Models;
using Assistant.Wrappers;
using System.Security.Claims;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StatsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public StatsController(AppDbContext db)
        {
            _db = db;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        private static readonly string[] DayLabelsVi = { "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN" };

        [HttpGet("weekly")]
        public async Task<IActionResult> GetWeeklyStats()
        {
            var userId = GetUserId();

            // Xác định tuần hiện tại theo giờ Việt Nam (UTC+7), tuần bắt đầu từ Thứ 2
            var nowUtc = DateTime.UtcNow;
            var nowVn = nowUtc.AddHours(7);
            var todayVn = nowVn.Date;
            int diffToMonday = ((int)todayVn.DayOfWeek + 6) % 7; // Monday = 0
            var weekStartVn = todayVn.AddDays(-diffToMonday);
            var weekStartUtc = weekStartVn.AddHours(-7);
            var weekEndUtc = weekStartUtc.AddDays(7);

            // ═══════════════ Lấy dữ liệu Calendar + Task trong tuần ═══════════════
            var events = await _db.CalendarEvents
                .Where(e => e.UserId == userId && e.StartTime < weekEndUtc && e.EndTime >= weekStartUtc)
                .Select(e => new { e.StartTime, e.EndTime, e.Priority })
                .ToListAsync();

            var weekTasks = await _db.Tasks
                .Where(t => t.UserId == userId && t.DueDate != null && t.DueDate >= weekStartUtc && t.DueDate < weekEndUtc)
                .Select(t => new { t.DueDate, t.EstimatedMinutes, t.Priority, t.Status })
                .ToListAsync();

            const int TaskUrgentPriority = 3; // Khẩn cấp
            const int EventUrgentPriority = 0; // Urgent

            // ═══════════════ BIỂU ĐỒ CỘT: gộp giờ Task + Calendar theo từng ngày ═══════════════
            var categories = new List<CategoryLegendDto>
            {
                new CategoryLegendDto { Id = null, Name = "Tổng thời gian", Color = "#6b38d4" },
                new CategoryLegendDto { Id = null, Name = "Khẩn cấp", Color = "#cbdbf5" }
            };

            var rawDays = new List<(string Label, DateTime DateVn, double PrimaryHours, double SecondaryHours)>();
            for (int i = 0; i < 7; i++)
            {
                var dayStartVn = weekStartVn.AddDays(i);
                var dayStartUtc = dayStartVn.AddHours(-7);
                var dayEndUtc = dayStartUtc.AddDays(1);

                var dayEvents = events.Where(e => e.StartTime < dayEndUtc && e.EndTime >= dayStartUtc).ToList();
                var dayTasks = weekTasks.Where(t => t.DueDate!.Value >= dayStartUtc && t.DueDate!.Value < dayEndUtc).ToList();

                double eventHours = dayEvents.Sum(e => Math.Max(0, (e.EndTime - e.StartTime).TotalHours));
                double taskHours = dayTasks.Sum(t => (t.EstimatedMinutes ?? 30) / 60.0);
                double totalHours = eventHours + taskHours;

                double eventUrgentHours = dayEvents.Where(e => e.Priority == EventUrgentPriority)
                    .Sum(e => Math.Max(0, (e.EndTime - e.StartTime).TotalHours));
                double taskUrgentHours = dayTasks.Where(t => t.Priority == TaskUrgentPriority)
                    .Sum(t => (t.EstimatedMinutes ?? 30) / 60.0);
                double urgentHours = eventUrgentHours + taskUrgentHours;

                rawDays.Add((DayLabelsVi[i], dayStartVn, Math.Round(totalHours, 1), Math.Round(urgentHours, 1)));
            }

            double maxHours = rawDays.Count == 0 ? 0 : rawDays.Max(d => Math.Max(d.PrimaryHours, d.SecondaryHours));
            if (maxHours <= 0) maxHours = 1; // tránh chia 0

            var days = rawDays.Select(d => new DailyTimeDto
            {
                Label = d.Label,
                Date = d.DateVn,
                PrimaryMinutes = (int)Math.Round(d.PrimaryHours * 60),
                SecondaryMinutes = (int)Math.Round(d.SecondaryHours * 60),
                PrimaryPercent = Math.Round(d.PrimaryHours / maxHours * 100, 0),
                SecondaryPercent = Math.Round(d.SecondaryHours / maxHours * 100, 0)
            }).ToList();

            // ═══════════════ MỤC TIÊU CÁ NHÂN ═══════════════
            var goals = new List<GoalProgressDto>();

            // Mục tiêu 1: gộp cả Task + Calendar trong tuần
            // Task "hoàn thành" = Status == "done"; Event "hoàn thành" = đã diễn ra xong (EndTime <= hiện tại)
            int totalCombined = weekTasks.Count + events.Count;
            int doneCombined = weekTasks.Count(t => t.Status == "done") + events.Count(e => e.EndTime <= nowUtc);
            int combinedPercent = totalCombined > 0 ? (int)Math.Round((double)doneCombined / totalCombined * 100) : 0;

            goals.Add(new GoalProgressDto
            {
                Title = "Công việc & lịch trong tuần",
                CurrentValue = doneCombined,
                TargetValue = totalCombined,
                Unit = "mục",
                PercentComplete = combinedPercent
            });

            // Mục tiêu 2: chỉ Task có Priority = 3 (Khẩn cấp)
            var urgentTasks = weekTasks.Where(t => t.Priority == TaskUrgentPriority).ToList();
            int totalUrgent = urgentTasks.Count;
            int doneUrgent = urgentTasks.Count(t => t.Status == "done");
            int urgentPercent = totalUrgent > 0 ? (int)Math.Round((double)doneUrgent / totalUrgent * 100) : 0;

            goals.Add(new GoalProgressDto
            {
                Title = "Task khẩn cấp",
                CurrentValue = doneUrgent,
                TargetValue = totalUrgent,
                Unit = "task",
                PercentComplete = urgentPercent
            });

            double overallCompletionRate = combinedPercent;

            var result = new WeeklyStatsDto
            {
                Categories = categories,
                Days = days,
                Goals = goals,
                OverallCompletionRate = overallCompletionRate
            };

            return Ok(new ApiResponse<WeeklyStatsDto>(result, "Lấy thống kê tuần thành công!"));
        }
    }

    public class WeeklyStatsDto
    {
        public List<CategoryLegendDto> Categories { get; set; } = new();
        public List<DailyTimeDto> Days { get; set; } = new();
        public List<GoalProgressDto> Goals { get; set; } = new();
        public double OverallCompletionRate { get; set; }
    }

    public class CategoryLegendDto
    {
        public Guid? Id { get; set; }
        public string Name { get; set; } = null!;
        public string Color { get; set; } = null!;
    }

    public class DailyTimeDto
    {
        public string Label { get; set; } = null!;
        public DateTime Date { get; set; }
        public int PrimaryMinutes { get; set; }
        public int SecondaryMinutes { get; set; }
        public double PrimaryPercent { get; set; }
        public double SecondaryPercent { get; set; }
    }

    public class GoalProgressDto
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Title { get; set; } = null!;
        public double CurrentValue { get; set; }
        public double TargetValue { get; set; }
        public string Unit { get; set; } = null!;
        public int PercentComplete { get; set; }
    }
}