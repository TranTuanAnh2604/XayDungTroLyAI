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
        //
        // Từ bản này: Task (có DueDate) cũng hiển thị trên trang Lịch, nên được
        // coi là MỘT PHẦN CỦA LỊCH. Thống kê gộp Task + CalendarEvent thành
        // MỘT nguồn dữ liệu duy nhất (CalendarItem), không tách thành 2-3 khối
        // riêng để tránh trùng lặp / dư số liệu.
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

            var items = await LoadRangeDataAsync(userId, weekStartVn, weekEndVn);
            var goals = await BuildGoals(userId, items);

            var rawDays = new List<(string Label, DateTime DateVn, double TotalHours, int EventCount, int DoneCount, string? DateRangeLabel)>();
            for (int i = 0; i < 7; i++)
            {
                var dayStartVn = weekStartVn.AddDays(i);
                var dayEndVn = dayStartVn.AddDays(1);
                var (hours, count, done) = ComputeRangeStats(items, dayStartVn, dayEndVn);
                rawDays.Add((DayLabelsVi[i], dayStartVn, Math.Round(hours, 1), count, done, null));
            }

            var days = BuildDailyTimeDtos(rawDays);
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
            var items = await LoadRangeDataAsync(userId, monthStartVn, monthEndVn);
            var goals = await BuildGoals(userId, items);

            // Gộp các ngày trong tháng thành các tuần Thứ 2 → Chủ nhật, tối đa 4 cột
            // (nếu tháng kéo dài sang tuần thứ 5, phần dư sẽ được gộp vào cột cuối)
            var weekBuckets = BuildWeekBuckets(monthStartVn, monthEndVn);

            var rawDays = new List<(string Label, DateTime DateVn, double TotalHours, int EventCount, int DoneCount, string? DateRangeLabel)>();
            for (int i = 0; i < weekBuckets.Count; i++)
            {
                var (bucketStart, bucketEnd) = weekBuckets[i];
                // Giới hạn lại trong phạm vi tháng để không tính nhầm dữ liệu tháng liền kề
                var clampedStart = bucketStart < monthStartVn ? monthStartVn : bucketStart;
                var clampedEnd = bucketEnd > monthEndVn ? monthEndVn : bucketEnd;
                var lastDayInBucket = clampedEnd.AddDays(-1); // ngày cuối cùng thực sự thuộc tuần này

                var (hours, count, done) = ComputeRangeStats(items, clampedStart, clampedEnd);
                var label = $"Tuần {i + 1}";
                var dateRangeLabel = $"{clampedStart:d/M} - {lastDayInBucket:d/M}";
                rawDays.Add((label, clampedStart, Math.Round(hours, 1), count, done, dateRangeLabel));
            }

            var days = BuildDailyTimeDtos(rawDays);
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

        // Gộp CalendarEvent và Task (có DueDate) thành 1 danh sách CalendarItem
        // thống nhất — vì Task cũng hiển thị trên trang Lịch nên được coi là
        // một phần của Lịch, không tách riêng nữa.
        private async Task<List<CalendarItem>> LoadRangeDataAsync(Guid userId, DateTime rangeStartVn, DateTime rangeEndVn)
        {
            var nowVn = DateTime.UtcNow.AddHours(7);

            // Join theo đúng chiều thực tế: Task.CalendarEventId trỏ về Event tạo ra nó
            // (không dùng Event.LinkedTaskId vì field này không được set khi tạo từ trang Lịch)
            var eventRows = await (
                from e in _db.CalendarEvents
                where e.UserId == userId
                    && e.EndTime > rangeStartVn
                    && e.StartTime < rangeEndVn
                join t in _db.Tasks on e.Id equals t.CalendarEventId into taskJoin
                from t in taskJoin.DefaultIfEmpty()
                select new
                {
                    e.StartTime,
                    e.EndTime,
                    LinkedTaskId = t != null ? (Guid?)t.Id : null,
                    LinkedTaskStatus = t != null ? t.Status : null
                }
            ).ToListAsync();

            var events = eventRows.Select(e => new CalendarItem
            {
                StartTime = e.StartTime,
                EndTime = e.EndTime,
                LinkedTaskId = e.LinkedTaskId,
                IsDone = e.LinkedTaskId != null
                    ? e.LinkedTaskStatus == "done"
                    : e.EndTime <= nowVn
            }).ToList();

            var sevenDaysLimit = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc).AddDays(7);

            var taskList = await _db.Tasks
                .Where(t => t.UserId == userId
                    && t.DueDate != null
                    && t.CalendarEventId == null
                    && t.DueDate <= sevenDaysLimit
                    && t.DueDate >= rangeStartVn
                    && t.DueDate < rangeEndVn)
                .ToListAsync();

            var tasks = taskList
                .Select(t => new CalendarItem
                {
                    StartTime = t.DueDate!.Value,
                    EndTime = t.DueDate!.Value.AddMinutes(30),
                    LinkedTaskId = t.Id,
                    IsDone = t.Status == "done"
                })
                .ToList();

            return events
                .Concat(tasks)
                .OrderBy(x => x.StartTime)
                .ToList();
        }

        // Tính tổng số giờ VÀ số lượng việc (Task + Event) trong 1 khoảng thời gian
        // bất kỳ (1 ngày hoặc cả 1 tuần).
        private static (double Hours, int Count, int Done) ComputeRangeStats(List<CalendarItem> items, DateTime rangeStartVn, DateTime rangeEndVn)
        {
            double totalHours = 0;
            int count = 0;
            int done = 0;

            foreach (var item in items)
            {
                if (item.StartTime >= rangeEndVn || item.EndTime <= rangeStartVn)
                    continue;

                var overlapStart = item.StartTime > rangeStartVn ? item.StartTime : rangeStartVn;
                var overlapEnd = item.EndTime < rangeEndVn ? item.EndTime : rangeEndVn;
                var duration = (overlapEnd - overlapStart).TotalHours;

                if (duration > 0)
                {
                    totalHours += duration;
                    count++;
                    if (item.IsDone) done++;
                }
            }

            return (totalHours, count, done);
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

        private static List<DailyTimeDto> BuildDailyTimeDtos(List<(string Label, DateTime DateVn, double TotalHours, int EventCount, int DoneCount, string? DateRangeLabel)> rawDays)
        {
            double maxHours = rawDays.Count == 0 ? 0 : rawDays.Max(d => d.TotalHours);
            if (maxHours <= 0) maxHours = 1;

            return rawDays.Select(d => new DailyTimeDto
            {
                Label = d.Label,
                Date = d.DateVn,
                TotalMinutes = (int)Math.Round(d.TotalHours * 60),
                TotalPercent = Math.Round(d.TotalHours / maxHours * 100, 0),
                EventCount = d.EventCount,
                DoneCount = d.DoneCount,
                DateRangeLabel = d.DateRangeLabel
            }).ToList();
        }

        private static List<CategoryLegendDto> BuildCategories() => new()
        {
            new CategoryLegendDto { Id = null, Name = "Tổng thời gian", Color = "#6b38d4" }
        };

        // Chỉ còn 1 Goal duy nhất, gộp cả Task + Event (vì đều thuộc về Lịch).
        private async System.Threading.Tasks.Task<List<GoalProgressDto>> BuildGoals(
    Guid userId,
    List<CalendarItem> items)
        {
            int total = items.Count;
            int done = items.Count(i => i.IsDone);

            int percent = total == 0
                ? 0
                : (int)Math.Round(done * 100.0 / total);

            return new List<GoalProgressDto>
            {
                new GoalProgressDto
                {
                    Title = "Lịch trình (Calendar)",
                    CurrentValue = done,
                    TargetValue = total,
                    Unit = "việc",
                    PercentComplete = percent
                }
            };
        }

        // Số tuần trong năm theo chuẩn ISO 8601 (tuần bắt đầu Thứ 2)
        private static int GetIsoWeekNumber(DateTime date)
        {
            var rule = System.Globalization.CalendarWeekRule.FirstFourDayWeek;
            var cal = System.Globalization.CultureInfo.InvariantCulture.Calendar;
            return cal.GetWeekOfYear(date, rule, DayOfWeek.Monday);
        }

        // Đại diện chung cho cả CalendarEvent và Task (khi có DueDate) —
        // vì cả 2 đều hiển thị trên trang Lịch nên gộp làm 1.
        private class CalendarItem
        {
            public DateTime StartTime { get; set; }
            public DateTime EndTime { get; set; }
            public Guid? LinkedTaskId { get; set; }
            public bool IsDone { get; set; }
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
        public int EventCount { get; set; }
        public int DoneCount { get; set; }
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