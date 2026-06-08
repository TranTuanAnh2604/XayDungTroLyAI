using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class UserMemory
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Category { get; set; } = null!;

    public string Key { get; set; } = null!;

    public string Value { get; set; } = null!;

    public string Source { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
