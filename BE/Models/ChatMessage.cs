using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class ChatMessage
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }

    public string Role { get; set; } = null!;

    public string Content { get; set; } = null!;

    public string? Metadata { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ChatSession Session { get; set; } = null!;
}
