using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class Task
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid? LinkedEventId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public byte Priority { get; set; }

    public string Status { get; set; } = null!;

    public DateTime? DueDate { get; set; }

    public int? EstimatedMinutes { get; set; }

    public string InputMethod { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public virtual ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();

    public virtual ICollection<TimeTracking> TimeTrackings { get; set; } = new List<TimeTracking>();

    public virtual User User { get; set; } = null!;

    public virtual ICollection<TaskCategory> Categories { get; set; } = new List<TaskCategory>();
}
