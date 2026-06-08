using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class TimeTracking
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid? TaskId { get; set; }

    public Guid? CategoryId { get; set; }

    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public int? DurationMinutes { get; set; }

    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual TaskCategory? Category { get; set; }

    public virtual Task? Task { get; set; }

    public virtual User User { get; set; } = null!;
}
