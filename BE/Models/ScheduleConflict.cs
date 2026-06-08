using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class ScheduleConflict
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid EventAId { get; set; }

    public Guid EventBId { get; set; }

    public DateTime DetectedAt { get; set; }

    public DateTime? ResolvedAt { get; set; }

    public string? Resolution { get; set; }

    public virtual CalendarEvent EventA { get; set; } = null!;

    public virtual CalendarEvent EventB { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
