using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class GoalProgress
{
    public Guid Id { get; set; }

    public Guid GoalId { get; set; }

    public double Value { get; set; }

    public string? Note { get; set; }

    public DateTime RecordedAt { get; set; }

    public virtual Goal Goal { get; set; } = null!;
}
