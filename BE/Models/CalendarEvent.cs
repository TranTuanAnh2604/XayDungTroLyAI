using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class CalendarEvent
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public string? Location { get; set; }

    public string Source { get; set; } = null!;

    public string? ExternalId { get; set; }

    public bool IsAllDay { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<ScheduleConflict> ScheduleConflictEventAs { get; set; } = new List<ScheduleConflict>();

    public virtual ICollection<ScheduleConflict> ScheduleConflictEventBs { get; set; } = new List<ScheduleConflict>();

    public virtual User User { get; set; } = null!;
}
