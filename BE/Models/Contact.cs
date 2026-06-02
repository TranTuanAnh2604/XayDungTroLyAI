using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class Contact
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Name { get; set; } = null!;

    public string? Phone { get; set; }

    public string? Email { get; set; }

    public string? Company { get; set; }

    public string? RelationshipLabel { get; set; }

    public DateTime SyncedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
