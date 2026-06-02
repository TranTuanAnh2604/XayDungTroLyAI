using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class ProductivityReport
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string PeriodType { get; set; } = null!;

    public DateOnly PeriodStart { get; set; }

    public DateOnly PeriodEnd { get; set; }

    public string ReportData { get; set; } = null!;

    public double CompletionRate { get; set; }

    public DateTime GeneratedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
