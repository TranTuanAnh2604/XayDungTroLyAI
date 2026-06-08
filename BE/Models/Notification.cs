using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class Notification
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid? EventId { get; set; }

    public string Title { get; set; } = null!;

    public string? Body { get; set; }

    public string Type { get; set; } = null!;

    public DateTime ScheduledAt { get; set; }

    public DateTime? SentAt { get; set; }

    public string Status { get; set; } = null!;

    public virtual CalendarEvent? Event { get; set; }

    public virtual User User { get; set; } = null!;
}
