using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class ExtractedEvent
{
    public Guid Id { get; set; }

    public Guid MessageId { get; set; }

    public string EventType { get; set; } = null!;

    public string EventData { get; set; } = null!;

    public double ConfidenceScore { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Message Message { get; set; } = null!;

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
}
