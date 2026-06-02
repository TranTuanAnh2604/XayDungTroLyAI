using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class TaskCategory
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Name { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string? Icon { get; set; }

    public virtual ICollection<TimeTracking> TimeTrackings { get; set; } = new List<TimeTracking>();

    public virtual User User { get; set; } = null!;

    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
}
