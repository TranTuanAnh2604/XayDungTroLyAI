using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class Message
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public string Sender { get; set; } = null!;

    public string Content { get; set; } = null!;

    public string Type { get; set; } = null!;

    public DateTime ReceivedAt { get; set; }

    public Guid? ExtractedEventId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ExtractedEvent? ExtractedEvent { get; set; }

    public virtual ICollection<ExtractedEvent> ExtractedEvents { get; set; } = new List<ExtractedEvent>();

    public virtual User User { get; set; } = null!;
}
