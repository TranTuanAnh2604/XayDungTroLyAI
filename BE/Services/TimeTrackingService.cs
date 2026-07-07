using Assistant.Models;
using Microsoft.EntityFrameworkCore;
using TimeTrackingModel = Assistant.Models.TimeTracking;

namespace Assistant.Services;

public class TimeTrackingService : ITimeTrackingService
{
    private readonly AppDbContext _context;

    public TimeTrackingService(AppDbContext context)
    {
        _context = context;
    }

    public async System.Threading.Tasks.Task StartSessionAsync(Guid userId)
    {
        var session = new TimeTrackingModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StartTime = DateTime.UtcNow,
            EndTime = null,
            CreatedAt = DateTime.UtcNow
        };

        _context.TimeTrackings.Add(session);
        await _context.SaveChangesAsync();
    }

    public async System.Threading.Tasks.Task EndSessionAsync(Guid userId)
    {
        var openSession = await _context.TimeTrackings
            .Where(t => t.UserId == userId && t.EndTime == null)
            .OrderByDescending(t => t.StartTime)
            .FirstOrDefaultAsync();

        if (openSession == null) return; // không có phiên nào đang mở, bỏ qua

        openSession.EndTime = DateTime.UtcNow;
        openSession.DurationMinutes = (int)(openSession.EndTime.Value - openSession.StartTime).TotalMinutes;

        await _context.SaveChangesAsync();
    }
}