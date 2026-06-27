using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class User
{
    public Guid Id { get; set; }
    public string PasswordHash { get; set; } = null!;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public string Name { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Timezone { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public bool IsEmailVerified { get; set; } = false;

    public string? OtpCode { get; set; }

    public DateTime? OtpExpiry { get; set; }

    public string? AvatarUrl { get; set; }

    public virtual ICollection<AutoAction> AutoActions { get; set; } = new List<AutoAction>();

    public virtual ICollection<CalendarEvent> CalendarEvents { get; set; } = new List<CalendarEvent>();

    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();

    public virtual ICollection<Contact> Contacts { get; set; } = new List<Contact>();

    public virtual ICollection<EmailSummary> EmailSummaries { get; set; } = new List<EmailSummary>();

    public virtual ICollection<Goal> Goals { get; set; } = new List<Goal>();

    public virtual ICollection<KnowledgeBase> KnowledgeBases { get; set; } = new List<KnowledgeBase>();

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();

    public virtual ICollection<ProductivityReport> ProductivityReports { get; set; } = new List<ProductivityReport>();

    public virtual ICollection<ScheduleConflict> ScheduleConflicts { get; set; } = new List<ScheduleConflict>();

    public virtual ICollection<TaskCategory> TaskCategories { get; set; } = new List<TaskCategory>();

    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();

    public virtual ICollection<TimeSlot> TimeSlots { get; set; } = new List<TimeSlot>();

    public virtual ICollection<TimeTracking> TimeTrackings { get; set; } = new List<TimeTracking>();

    public virtual ICollection<Todo> Todos { get; set; } = new List<Todo>();

    public virtual ICollection<UserMemory> UserMemories { get; set; } = new List<UserMemory>();

    public virtual ICollection<VoiceTranscript> VoiceTranscripts { get; set; } = new List<VoiceTranscript>();
}
