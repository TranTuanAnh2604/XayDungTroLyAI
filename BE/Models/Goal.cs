using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class Goal
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public double TargetValue { get; set; }

    public double CurrentValue { get; set; }

    public string Unit { get; set; } = null!;

    public DateOnly? Deadline { get; set; }

    public string Status { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<GoalProgress> GoalProgresses { get; set; } = new List<GoalProgress>();

    public virtual User User { get; set; } = null!;
}
