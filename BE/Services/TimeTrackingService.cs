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
        var nowVn = DateTime.UtcNow.AddHours(7);

        var session = new TimeTrackingModel
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            StartTime = nowVn,
            EndTime = null,
            CreatedAt = nowVn
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

        if (openSession == null) return;

        var nowVn = DateTime.UtcNow.AddHours(7);

        openSession.EndTime = nowVn;
        openSession.DurationMinutes = (int)(openSession.EndTime.Value - openSession.StartTime).TotalMinutes;

        await _context.SaveChangesAsync();
    }
}