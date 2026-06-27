namespace Assistant.Models;

public partial class VoiceTranscript
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Transcript { get; set; } = null!;
    public string? AiResponse { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual User User { get; set; } = null!;
}