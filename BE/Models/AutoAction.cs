using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class AutoAction
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string TriggerType { get; set; } = null!;

    public string TriggerData { get; set; } = null!;

    public string ActionType { get; set; } = null!;

    public string ActionData { get; set; } = null!;

    public string Status { get; set; } = null!;

    public DateTime? ExecutedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
