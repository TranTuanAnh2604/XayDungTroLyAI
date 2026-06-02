using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class Todo
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Title { get; set; } = null!;

    public string? Description { get; set; }

    public DateOnly? DueDate { get; set; }

    public bool Completed { get; set; }

    public DateTime? CompletedAt { get; set; }

    public string Source { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
