using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class KnowledgeBase
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string EntityType { get; set; } = null!;

    public string EntityName { get; set; } = null!;

    public string Attribute { get; set; } = null!;

    public string Value { get; set; } = null!;

    public string Source { get; set; } = null!;

    public double Confidence { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
