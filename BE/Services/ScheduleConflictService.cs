using Microsoft.EntityFrameworkCore;
using Assistant.Models;

namespace Assistant.Services
{
    public class ScheduleConflictItem
    {
        public string Type { get; set; } = null!; // "event" | "task"
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }

    public class ScheduleConflictService
    {
        private readonly AppDbContext _db;
        public ScheduleConflictService(AppDbContext db) => _db = db;

        public async Task<List<ScheduleConflictItem>> FindConflictsAsync(
            Guid userId, DateTime start, DateTime end,
            Guid? excludeEventId = null, Guid? excludeTaskId = null)
        {
            var conflicts = new List<ScheduleConflictItem>();

            var events = await _db.CalendarEvents
                .Where(e => e.UserId == userId
                    && (excludeEventId == null || e.Id != excludeEventId)
                    && e.StartTime < end && e.EndTime > start)
                .Select(e => new ScheduleConflictItem
                {
                    Type = "event",
                    Id = e.Id,
                    Title = e.Title,
                    StartTime = e.StartTime,
                    EndTime = e.EndTime
                })
                .ToListAsync();
            conflicts.AddRange(events);

            var tasks = await _db.Tasks
                .Where(t => t.UserId == userId
                    && t.DueDate != null
                    && (excludeTaskId == null || t.Id != excludeTaskId)
                    // Bỏ qua task chính là task liên kết của event đang xét (tránh tự báo trùng với chính mình)
                    && (excludeEventId == null || t.CalendarEventId != excludeEventId)
                    // Bỏ qua task chính là task liên kết của event đã bị loại ở trên (khi update Task mà nó có event liên kết)
                    && (excludeTaskId == null || t.CalendarEventId != excludeEventId))
                .Select(t => new { t.Id, t.Title, Start = t.DueDate!.Value })
                .ToListAsync();

            foreach (var t in tasks)
            {
                var tEnd = t.Start.AddMinutes(30);
                if (t.Start < end && tEnd > start)
                {
                    conflicts.Add(new ScheduleConflictItem
                    {
                        Type = "task",
                        Id = t.Id,
                        Title = t.Title,
                        StartTime = t.Start,
                        EndTime = tEnd
                    });
                }
            }

            return conflicts;
        }
    }

    public static class PriorityMapper
    {
        // Calendar: 0=Urgent, 1=Normal, 2=Low
        // Task:     1=Low,    2=Normal, 3=Urgent
        public static byte CalendarToTask(int calendarPriority) => calendarPriority switch
        {
            0 => 3,
            2 => 1,
            _ => 2
        };

        public static int TaskToCalendar(int taskPriority) => taskPriority switch
        {
            3 => 0,
            1 => 2,
            _ => 1
        };
    }
}