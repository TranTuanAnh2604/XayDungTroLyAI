using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class TimeSlot
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public Guid TaskId { get; set; }

    public DateTime SuggestedStart { get; set; }

    public DateTime SuggestedEnd { get; set; }

    public double Score { get; set; }

    public bool Accepted { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Task Task { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
