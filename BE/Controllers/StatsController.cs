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

        // Số cột tối đa khi gộp theo tuần cho thống kê tháng
        private const int MaxMonthlyBuckets = 4;

        // ═══════════════════════════════════════════════════════════════════
        // Ghi chú quan trọng về timezone:
        // Toàn bộ DateTime lưu trong DB (StartTime, EndTime, DueDate...) đều là
        // GIỜ VIỆT NAM (wall-clock) nhưng bị gắn nhãn Kind=Utc (theo convention
        // của dự án, do Npgsql.EnableLegacyTimestampBehavior). Đây KHÔNG phải
        // giờ UTC thật. Vì vậy khi so sánh khoảng thời gian, KHÔNG được trừ/cộng
        // thêm 7 tiếng nữa — chỉ cần lấy đúng "giờ VN hiện tại" (nowVn) và so
        // sánh trực tiếp với giá trị trong DB.
        // ═══════════════════════════════════════════════════════════════════

        [HttpGet("weekly")]
        public async Task<IActionResult> GetWeeklyStats()
        {
            var userId = GetUserId();

            var nowUtc = DateTime.UtcNow;
            var nowVn = nowUtc.AddHours(7);
            var todayVn = nowVn.Date;

            // Tuần bắt đầu từ Thứ 2
            int diffToMonday = ((int)todayVn.DayOfWeek + 6) % 7; // Monday = 0
            var weekStartVn = todayVn.AddDays(-diffToMonday);
            var weekEndVn = weekStartVn.AddDays(7);

            var (events, tasks) = await LoadRangeDataAsync(userId, weekStartVn, weekEndVn);

            var rawDays = new List<(string Label, DateTime DateVn, double TotalHours, string? DateRangeLabel)>();
            for (int i = 0; i < 7; i++)
            {
                var dayStartVn = weekStartVn.AddDays(i);
                var dayEndVn = dayStartVn.AddDays(1);
                double totalHours = ComputeRangeHours(events, tasks, dayStartVn, dayEndVn);
                rawDays.Add((DayLabelsVi[i], dayStartVn, Math.Round(totalHours, 1), null));
            }

            var days = BuildDailyTimeDtos(rawDays);
            var goals = BuildGoals(tasks, events, nowVn);
            double overallCompletionRate = goals.Last().PercentComplete;

            var result = new PeriodStatsDto
            {
                PeriodLabel = $"Tuần {GetIsoWeekNumber(weekStartVn)} ({weekStartVn:dd/MM} - {weekEndVn.AddDays(-1):dd/MM})",
                Categories = BuildCategories(),
                Days = days,
                Goals = goals,
                OverallCompletionRate = overallCompletionRate
            };

            return Ok(new ApiResponse<PeriodStatsDto>(result, "Lấy thống kê tuần thành công!"));
        }

        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthlyStats([FromQuery] int? year, [FromQuery] int? month)
        {
            var userId = GetUserId();

            var nowUtc = DateTime.UtcNow;
            var nowVn = nowUtc.AddHours(7);

            // Cho phép xem tháng khác qua query, mặc định là tháng hiện tại (giờ VN)
            int targetYear = year ?? nowVn.Year;
            int targetMonth = month ?? nowVn.Month;

            var monthStartVn = new DateTime(targetYear, targetMonth, 1);
            var monthEndVn = monthStartVn.AddMonths(1);

            var (events, tasks) = await LoadRangeDataAsync(userId, monthStartVn, monthEndVn);

            // Gộp các ngày trong tháng thành các tuần Thứ 2 → Chủ nhật, tối đa 4 cột
            // (nếu tháng kéo dài sang tuần thứ 5, phần dư sẽ được gộp vào cột cuối)
            var weekBuckets = BuildWeekBuckets(monthStartVn, monthEndVn);

            var rawDays = new List<(string Label, DateTime DateVn, double TotalHours, string? DateRangeLabel)>();
            for (int i = 0; i < weekBuckets.Count; i++)
            {
                var (bucketStart, bucketEnd) = weekBuckets[i];
                // Giới hạn lại trong phạm vi tháng để không tính nhầm dữ liệu tháng liền kề
                var clampedStart = bucketStart < monthStartVn ? monthStartVn : bucketStart;
                var clampedEnd = bucketEnd > monthEndVn ? monthEndVn : bucketEnd;
                var lastDayInBucket = clampedEnd.AddDays(-1); // ngày cuối cùng thực sự thuộc tuần này

                double totalHours = ComputeRangeHours(events, tasks, clampedStart, clampedEnd);
                var label = $"Tuần {i + 1}";
                var dateRangeLabel = $"{clampedStart:d/M} - {lastDayInBucket:d/M}";
                rawDays.Add((label, clampedStart, Math.Round(totalHours, 1), dateRangeLabel));
            }

            var days = BuildDailyTimeDtos(rawDays);
            var goals = BuildGoals(tasks, events, nowVn);
            double overallCompletionRate = goals.Last().PercentComplete;

            var result = new PeriodStatsDto
            {
                PeriodLabel = $"Tháng {targetMonth}/{targetYear}",
                Categories = BuildCategories(),
                Days = days,
                Goals = goals,
                OverallCompletionRate = overallCompletionRate
            };

            return Ok(new ApiResponse<PeriodStatsDto>(result, "Lấy thống kê tháng thành công!"));
        }

        // ═══════════════════════════════════════════════════════════════════
        // HELPERS DÙNG CHUNG CHO CẢ TUẦN VÀ THÁNG
        // ═══════════════════════════════════════════════════════════════════

        private async Task<(List<EventItem> Events, List<TaskItem> Tasks)> LoadRangeDataAsync(
            Guid userId, DateTime rangeStartVn, DateTime rangeEndVn)
        {
            var events = await _db.CalendarEvents
                .Where(e => e.UserId == userId && e.StartTime < rangeEndVn && e.EndTime >= rangeStartVn)
                .Select(e => new EventItem { StartTime = e.StartTime, EndTime = e.EndTime, Priority = e.Priority })
                .ToListAsync();

            var tasks = await _db.Tasks
                .Where(t => t.UserId == userId && t.DueDate != null && t.DueDate >= rangeStartVn && t.DueDate < rangeEndVn)
                .Select(t => new TaskItem { DueDate = t.DueDate, EstimatedMinutes = t.EstimatedMinutes, Priority = t.Priority, Status = t.Status })
                .ToListAsync();

            return (events, tasks);
        }

        // Tính tổng số giờ (event + task) trong 1 khoảng thời gian bất kỳ (1 ngày hoặc cả 1 tuần)
        private static double ComputeRangeHours(List<EventItem> events, List<TaskItem> tasks, DateTime rangeStartVn, DateTime rangeEndVn)
        {
            var rangeEvents = events.Where(e => e.StartTime < rangeEndVn && e.EndTime >= rangeStartVn).ToList();
            var rangeTasks = tasks.Where(t => t.DueDate!.Value >= rangeStartVn && t.DueDate!.Value < rangeEndVn).ToList();

            double eventHours = rangeEvents.Sum(e => Math.Max(0, (e.EndTime - e.StartTime).TotalHours));
            double taskHours = rangeTasks.Sum(t => (t.EstimatedMinutes ?? 30) / 60.0);
            return eventHours + taskHours;
        }

        // Chia khoảng [monthStartVn, monthEndVn) thành các tuần Thứ 2 → Chủ nhật.
        // Nếu số tuần vượt quá MaxMonthlyBuckets, gộp phần dư vào bucket cuối cùng.
        private static List<(DateTime Start, DateTime End)> BuildWeekBuckets(DateTime monthStartVn, DateTime monthEndVn)
        {
            var buckets = new List<(DateTime Start, DateTime End)>();

            int diffToMonday = ((int)monthStartVn.DayOfWeek + 6) % 7; // Monday = 0
            var cursor = monthStartVn.AddDays(-diffToMonday);

            while (cursor < monthEndVn)
            {
                var next = cursor.AddDays(7);
                buckets.Add((cursor, next));
                cursor = next;
            }

            if (buckets.Count > MaxMonthlyBuckets)
            {
                var merged = buckets.Take(MaxMonthlyBuckets - 1).ToList();
                var lastStart = buckets[MaxMonthlyBuckets - 1].Start;
                var lastEnd = buckets.Last().End;
                merged.Add((lastStart, lastEnd));
                buckets = merged;
            }

            return buckets;
        }

        private static List<DailyTimeDto> BuildDailyTimeDtos(List<(string Label, DateTime DateVn, double TotalHours, string? DateRangeLabel)> rawDays)
        {
            double maxHours = rawDays.Count == 0 ? 0 : rawDays.Max(d => d.TotalHours);
            if (maxHours <= 0) maxHours = 1; // tránh chia 0

            return rawDays.Select(d => new DailyTimeDto
            {
                Label = d.Label,
                Date = d.DateVn,
                TotalMinutes = (int)Math.Round(d.TotalHours * 60),
                TotalPercent = Math.Round(d.TotalHours / maxHours * 100, 0),
                DateRangeLabel = d.DateRangeLabel
            }).ToList();
        }

        private static List<CategoryLegendDto> BuildCategories() => new()
        {
            new CategoryLegendDto { Id = null, Name = "Tổng thời gian", Color = "#6b38d4" }
        };

        private static List<GoalProgressDto> BuildGoals(List<TaskItem> tasks, List<EventItem> events, DateTime nowVn)
        {
            var goals = new List<GoalProgressDto>();

            // Mục tiêu 1: riêng Task
            int totalTasks = tasks.Count;
            int doneTasks = tasks.Count(t => t.Status == "done");
            int taskPercent = totalTasks > 0 ? (int)Math.Round((double)doneTasks / totalTasks * 100) : 0;

            goals.Add(new GoalProgressDto
            {
                Title = "Công việc (Task)",
                CurrentValue = doneTasks,
                TargetValue = totalTasks,
                Unit = "task",
                PercentComplete = taskPercent
            });

            // Mục tiêu 2: riêng Lịch (Calendar) — "hoàn thành" = đã diễn ra xong theo giờ VN hiện tại
            int totalEvents = events.Count;
            int doneEvents = events.Count(e => e.EndTime <= nowVn);
            int eventPercent = totalEvents > 0 ? (int)Math.Round((double)doneEvents / totalEvents * 100) : 0;

            goals.Add(new GoalProgressDto
            {
                Title = "Lịch trình (Calendar)",
                CurrentValue = doneEvents,
                TargetValue = totalEvents,
                Unit = "sự kiện",
                PercentComplete = eventPercent
            });

            // Mục tiêu 3: tổng hợp
            int totalCombined = totalTasks + totalEvents;
            int doneCombined = doneTasks + doneEvents;
            int combinedPercent = totalCombined > 0 ? (int)Math.Round((double)doneCombined / totalCombined * 100) : 0;

            goals.Add(new GoalProgressDto
            {
                Title = "Tổng hợp",
                CurrentValue = doneCombined,
                TargetValue = totalCombined,
                Unit = "mục",
                PercentComplete = combinedPercent
            });

            return goals;
        }

        // Số tuần trong năm theo chuẩn ISO 8601 (tuần bắt đầu Thứ 2)
        private static int GetIsoWeekNumber(DateTime date)
        {
            var rule = System.Globalization.CalendarWeekRule.FirstFourDayWeek;
            var cal = System.Globalization.CultureInfo.InvariantCulture.Calendar;
            return cal.GetWeekOfYear(date, rule, DayOfWeek.Monday);
        }

        private class EventItem
        {
            public DateTime StartTime { get; set; }
            public DateTime EndTime { get; set; }
            public int Priority { get; set; }
        }

        private class TaskItem
        {
            public DateTime? DueDate { get; set; }
            public int? EstimatedMinutes { get; set; }
            public byte Priority { get; set; }
            public string Status { get; set; } = null!;
        }
    }

    // DTO dùng chung cho cả /weekly và /monthly
    public class PeriodStatsDto
    {
        public string PeriodLabel { get; set; } = null!;
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
        public int TotalMinutes { get; set; }
        public double TotalPercent { get; set; }
        // Khoảng ngày hiển thị dưới Label, ví dụ "1/7 - 7/7". Chỉ dùng cho thống kê tháng (gộp theo tuần).
        public string? DateRangeLabel { get; set; }
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