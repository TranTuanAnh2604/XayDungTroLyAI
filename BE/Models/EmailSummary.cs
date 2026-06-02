using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class EmailSummary
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string OriginalMessageId { get; set; } = null!;

    public string Summary { get; set; } = null!;

    public string? KeyPoints { get; set; }

    public string? ActionItems { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
