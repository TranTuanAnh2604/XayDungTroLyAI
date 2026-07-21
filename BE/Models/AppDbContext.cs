using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;

namespace Assistant.Models;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AutoAction> AutoActions { get; set; }
    public virtual DbSet<CalendarEvent> CalendarEvents { get; set; }
    public virtual DbSet<ChatMessage> ChatMessages { get; set; }
    public virtual DbSet<ChatSession> ChatSessions { get; set; }
    public virtual DbSet<Contact> Contacts { get; set; }
    public virtual DbSet<EmailSummary> EmailSummaries { get; set; }
    public virtual DbSet<ExtractedEvent> ExtractedEvents { get; set; }
    public virtual DbSet<Goal> Goals { get; set; }
    public virtual DbSet<GoalProgress> GoalProgresses { get; set; }
    public virtual DbSet<KnowledgeBase> KnowledgeBases { get; set; }
    public virtual DbSet<Message> Messages { get; set; }
    public virtual DbSet<Notification> Notifications { get; set; }
    public virtual DbSet<ProductivityReport> ProductivityReports { get; set; }
    public virtual DbSet<ScheduleConflict> ScheduleConflicts { get; set; }
    public virtual DbSet<Task> Tasks { get; set; }
    public virtual DbSet<TaskCategory> TaskCategories { get; set; }
    public virtual DbSet<TimeSlot> TimeSlots { get; set; }
    public virtual DbSet<TimeTracking> TimeTrackings { get; set; }
    public virtual DbSet<Todo> Todos { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<UserMemory> UserMemories { get; set; }
    public virtual DbSet<VoiceTranscript> VoiceTranscripts { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AutoAction>(entity =>
        {
            entity.ToTable("auto_actions");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActionData).HasColumnName("action_data");
            entity.Property(e => e.ActionType).HasMaxLength(50).HasColumnName("action_type");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.ExecutedAt).HasColumnName("executed_at");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("active").HasColumnName("status");
            entity.Property(e => e.TriggerData).HasColumnName("trigger_data");
            entity.Property(e => e.TriggerType).HasMaxLength(50).HasColumnName("trigger_type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.AutoActions)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_auto_actions_user");
        });

        modelBuilder.Entity<CalendarEvent>(entity =>
        {
            entity.ToTable("calendar_events");
            entity.HasIndex(e => new { e.UserId, e.StartTime }, "IX_calendar_events_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.EndTime).HasColumnName("end_time");
            entity.Property(e => e.ExternalId).HasMaxLength(500).HasColumnName("external_id");
            entity.Property(e => e.IsAllDay).HasColumnName("is_all_day");
            entity.Property(e => e.Location).HasMaxLength(500).HasColumnName("location");
            entity.Property(e => e.Source).HasMaxLength(50).HasDefaultValue("manual").HasColumnName("source");
            entity.Property(e => e.StartTime).HasColumnName("start_time");
            entity.Property(e => e.Title).HasMaxLength(500).HasColumnName("title");
            entity.Property(e => e.Priority).HasDefaultValue(2).HasColumnName("priority").ValueGeneratedNever();
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.CalendarEvents)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_calendar_events_user");
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("chat_messages");
            entity.HasIndex(e => new { e.SessionId, e.CreatedAt }, "IX_chat_messages_session");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Metadata).HasColumnName("metadata");
            entity.Property(e => e.Role).HasMaxLength(10).HasColumnName("role");
            entity.Property(e => e.SessionId).HasColumnName("session_id");

            entity.HasOne(d => d.Session).WithMany(p => p.ChatMessages)
                .HasForeignKey(d => d.SessionId)
                .HasConstraintName("FK_chat_messages_session");
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.ToTable("chat_sessions");
            entity.HasIndex(e => new { e.UserId, e.LastActivity }, "IX_chat_sessions_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.LastActivity).HasColumnName("last_activity");
            entity.Property(e => e.Title).HasMaxLength(500).HasColumnName("title");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.ChatSessions)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_chat_sessions_user");
        });

        modelBuilder.Entity<Contact>(entity =>
        {
            entity.ToTable("contacts");
            entity.HasIndex(e => e.UserId, "IX_contacts_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Company).HasMaxLength(200).HasColumnName("company");
            entity.Property(e => e.Email).HasMaxLength(255).HasColumnName("email");
            entity.Property(e => e.Name).HasMaxLength(150).HasColumnName("name");
            entity.Property(e => e.Phone).HasMaxLength(50).HasColumnName("phone");
            entity.Property(e => e.RelationshipLabel).HasMaxLength(100).HasColumnName("relationship_label");
            entity.Property(e => e.SyncedAt).HasColumnName("synced_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Contacts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_contacts_user");
        });

        modelBuilder.Entity<EmailSummary>(entity =>
        {
            entity.ToTable("email_summaries");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActionItems).HasColumnName("action_items");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.KeyPoints).HasColumnName("key_points");
            entity.Property(e => e.OriginalMessageId).HasMaxLength(500).HasColumnName("original_message_id");
            entity.Property(e => e.Summary).HasColumnName("summary");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.EmailSummaries)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_email_summaries_user");
        });

        modelBuilder.Entity<ExtractedEvent>(entity =>
        {
            entity.ToTable("extracted_events");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ConfidenceScore).HasDefaultValue(1.0).HasColumnName("confidence_score");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.EventData).HasColumnName("event_data");
            entity.Property(e => e.EventType).HasMaxLength(100).HasColumnName("event_type");
            entity.Property(e => e.MessageId).HasColumnName("message_id");

            entity.HasOne(d => d.Message).WithMany(p => p.ExtractedEvents)
                .HasForeignKey(d => d.MessageId)
                .HasConstraintName("FK_extracted_events_message");
        });

        modelBuilder.Entity<Goal>(entity =>
        {
            entity.ToTable("goals");
            entity.HasIndex(e => new { e.UserId, e.Status }, "IX_goals_user_status");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CurrentValue).HasColumnName("current_value");
            entity.Property(e => e.Deadline).HasColumnName("deadline");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("active").HasColumnName("status");
            entity.Property(e => e.TargetValue).HasColumnName("target_value");
            entity.Property(e => e.Title).HasMaxLength(500).HasColumnName("title");
            entity.Property(e => e.Unit).HasMaxLength(100).HasDefaultValue("lần").HasColumnName("unit");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Goals)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_goals_user");
        });

        modelBuilder.Entity<GoalProgress>(entity =>
        {
            entity.ToTable("goal_progress");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.GoalId).HasColumnName("goal_id");
            entity.Property(e => e.Note).HasMaxLength(500).HasColumnName("note");
            entity.Property(e => e.RecordedAt).HasColumnName("recorded_at");
            entity.Property(e => e.Value).HasColumnName("value");

            entity.HasOne(d => d.Goal).WithMany(p => p.GoalProgresses)
                .HasForeignKey(d => d.GoalId)
                .HasConstraintName("FK_gp_goal");
        });

        modelBuilder.Entity<KnowledgeBase>(entity =>
        {
            entity.ToTable("knowledge_base");
            entity.HasIndex(e => new { e.UserId, e.EntityName }, "IX_knowledge_entity");
            entity.HasIndex(e => new { e.UserId, e.EntityName, e.Attribute }, "UQ_knowledge_base_entry").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Attribute).HasMaxLength(300).HasColumnName("attribute");
            entity.Property(e => e.Confidence).HasDefaultValue(1.0).HasColumnName("confidence");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.EntityName).HasMaxLength(300).HasColumnName("entity_name");
            entity.Property(e => e.EntityType).HasMaxLength(100).HasColumnName("entity_type");
            entity.Property(e => e.Source).HasMaxLength(50).HasDefaultValue("ai_inferred").HasColumnName("source");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Value).HasColumnName("value");

            entity.HasOne(d => d.User).WithMany(p => p.KnowledgeBases)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_knowledge_base_user");
        });

        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("messages");
            entity.HasIndex(e => new { e.UserId, e.ReceivedAt }, "IX_messages_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.ExtractedEventId).HasColumnName("extracted_event_id");
            entity.Property(e => e.ReceivedAt).HasColumnName("received_at");
            entity.Property(e => e.Sender).HasMaxLength(255).HasColumnName("sender");
            entity.Property(e => e.Type).HasMaxLength(10).HasColumnName("type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.ExtractedEvent).WithMany(p => p.Messages)
                .HasForeignKey(d => d.ExtractedEventId)
                .HasConstraintName("FK_messages_extracted_event");

            entity.HasOne(d => d.User).WithMany(p => p.Messages)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_messages_user");
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.HasIndex(e => new { e.UserId, e.ScheduledAt }, "IX_notifications_sched");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Body).HasColumnName("body");
            entity.Property(e => e.EventId).HasColumnName("event_id");
            entity.Property(e => e.ScheduledAt).HasColumnName("scheduled_at");
            entity.Property(e => e.SentAt).HasColumnName("sent_at");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("pending").HasColumnName("status");
            entity.Property(e => e.Title).HasMaxLength(300).HasColumnName("title");
            entity.Property(e => e.Type).HasMaxLength(30).HasDefaultValue("reminder").HasColumnName("type");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Event).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.EventId)
                .HasConstraintName("FK_notifications_event");

            entity.HasOne(d => d.User).WithMany(p => p.Notifications)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_notifications_user");
        });

        modelBuilder.Entity<ProductivityReport>(entity =>
        {
            entity.ToTable("productivity_reports");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CompletionRate).HasColumnName("completion_rate");
            entity.Property(e => e.GeneratedAt).HasColumnName("generated_at");
            entity.Property(e => e.PeriodEnd).HasColumnName("period_end");
            entity.Property(e => e.PeriodStart).HasColumnName("period_start");
            entity.Property(e => e.PeriodType).HasMaxLength(10).HasColumnName("period_type");
            entity.Property(e => e.ReportData).HasColumnName("report_data");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.ProductivityReports)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_pr_user");
        });

        modelBuilder.Entity<ScheduleConflict>(entity =>
        {
            entity.ToTable("schedule_conflicts");
            entity.HasIndex(e => new { e.UserId, e.DetectedAt }, "IX_conflicts_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.DetectedAt).HasColumnName("detected_at");
            entity.Property(e => e.EventAId).HasColumnName("event_a_id");
            entity.Property(e => e.EventBId).HasColumnName("event_b_id");
            entity.Property(e => e.Resolution).HasColumnName("resolution");
            entity.Property(e => e.ResolvedAt).HasColumnName("resolved_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.EventA).WithMany(p => p.ScheduleConflictEventAs)
                .HasForeignKey(d => d.EventAId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_sc_event_a");

            entity.HasOne(d => d.EventB).WithMany(p => p.ScheduleConflictEventBs)
                .HasForeignKey(d => d.EventBId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_sc_event_b");

            entity.HasOne(d => d.User).WithMany(p => p.ScheduleConflicts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_sc_user");
        });

        modelBuilder.Entity<Task>(entity =>
        {
            entity.ToTable("tasks");
            entity.HasIndex(e => new { e.UserId, e.Status, e.Priority }, "IX_tasks_user_status");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.EstimatedMinutes).HasColumnName("estimated_minutes");
            entity.Property(e => e.InputMethod).HasMaxLength(10).HasDefaultValue("text").HasColumnName("input_method");
            entity.Property(e => e.Priority).HasDefaultValue((byte)2).HasColumnName("priority").ValueGeneratedNever();
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("pending").HasColumnName("status");
            entity.Property(e => e.Title).HasMaxLength(500).HasColumnName("title");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Tasks)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_tasks_user");

            entity.HasMany(d => d.Categories).WithMany(p => p.Tasks)
                .UsingEntity<Dictionary<string, object>>(
                    "TaskCategoryMap",
                    r => r.HasOne<TaskCategory>().WithMany().HasForeignKey("CategoryId").OnDelete(DeleteBehavior.ClientSetNull).HasConstraintName("FK_tcm_category"),
                    l => l.HasOne<Task>().WithMany().HasForeignKey("TaskId").HasConstraintName("FK_tcm_task"),
                    j =>
                    {
                        j.HasKey("TaskId", "CategoryId");
                        j.ToTable("task_category_map");
                        j.IndexerProperty<Guid>("TaskId").HasColumnName("task_id");
                        j.IndexerProperty<Guid>("CategoryId").HasColumnName("category_id");
                    });
        });

        modelBuilder.Entity<TaskCategory>(entity =>
        {
            entity.ToTable("task_categories");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Color).HasMaxLength(7).HasDefaultValue("#7F77DD").HasColumnName("color");
            entity.Property(e => e.Icon).HasMaxLength(100).HasColumnName("icon");
            entity.Property(e => e.Name).HasMaxLength(100).HasColumnName("name");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.TaskCategories)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_task_categories_user");
        });

        modelBuilder.Entity<TimeSlot>(entity =>
        {
            entity.ToTable("time_slots");
            entity.HasIndex(e => new { e.TaskId, e.Score }, "IX_time_slots_task");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Accepted).HasColumnName("accepted");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Score).HasDefaultValue(0.5).HasColumnName("score");
            entity.Property(e => e.SuggestedEnd).HasColumnName("suggested_end");
            entity.Property(e => e.SuggestedStart).HasColumnName("suggested_start");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Task).WithMany(p => p.TimeSlots)
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("FK_time_slots_task");

            entity.HasOne(d => d.User).WithMany(p => p.TimeSlots)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_time_slots_user");
        });

        modelBuilder.Entity<TimeTracking>(entity =>
        {
            entity.ToTable("time_tracking");
            entity.HasIndex(e => new { e.UserId, e.StartTime }, "IX_time_tracking_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.DurationMinutes).HasColumnName("duration_minutes"); // Đã gỡ hàm tính khoảng cách ngày SQL Server
            entity.Property(e => e.EndTime).HasColumnName("end_time");
            entity.Property(e => e.Note).HasMaxLength(500).HasColumnName("note");
            entity.Property(e => e.StartTime).HasColumnName("start_time");
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Category).WithMany(p => p.TimeTrackings)
                .HasForeignKey(d => d.CategoryId)
                .HasConstraintName("FK_tt_category");

            entity.HasOne(d => d.Task).WithMany(p => p.TimeTrackings)
                .HasForeignKey(d => d.TaskId)
                .HasConstraintName("FK_tt_task");

            entity.HasOne(d => d.User).WithMany(p => p.TimeTrackings)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_tt_user");
        });

        modelBuilder.Entity<Todo>(entity =>
        {
            entity.ToTable("todos");
            entity.HasIndex(e => new { e.UserId, e.DueDate }, "IX_todos_user_due");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Completed).HasColumnName("completed");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.Source).HasMaxLength(50).HasDefaultValue("manual").HasColumnName("source");
            entity.Property(e => e.Title).HasMaxLength(500).HasColumnName("title");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Todos)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_todos_user");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasIndex(e => e.Email, "UQ_users_email").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Email).HasMaxLength(255).HasColumnName("email");
            entity.Property(e => e.Name).HasMaxLength(150).HasColumnName("name");
            entity.Property(e => e.Timezone).HasMaxLength(100).HasDefaultValue("Asia/Ho_Chi_Minh").HasColumnName("timezone");
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash");
            entity.Property(e => e.RefreshToken).HasColumnName("refresh_token");
            entity.Property(e => e.RefreshTokenExpiryTime).HasColumnName("refresh_token_expiry_time");
        });

        modelBuilder.Entity<UserMemory>(entity =>
        {
            entity.ToTable("user_memories");
            entity.HasIndex(e => new { e.UserId, e.Category, e.Key }, "IX_user_memories_lookup");
            entity.HasIndex(e => new { e.UserId, e.Category, e.Key }, "UQ_user_memories_key").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Category).HasMaxLength(100).HasColumnName("category");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Key).HasMaxLength(300).HasColumnName("key");
            entity.Property(e => e.Source).HasMaxLength(50).HasDefaultValue("manual").HasColumnName("source");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Value).HasColumnName("value");

            entity.HasOne(d => d.User).WithMany(p => p.UserMemories)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_user_memories_user");
        });

        modelBuilder.Entity<VoiceTranscript>(entity =>
        {
            entity.ToTable("voice_transcripts");
            entity.HasIndex(e => new { e.UserId, e.CreatedAt }, "IX_voice_transcripts_user");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.Transcript).HasColumnName("transcript");
            entity.Property(e => e.AiResponse).HasColumnName("ai_response");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(d => d.User).WithMany(p => p.VoiceTranscripts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_voice_transcripts_user");
        });

        OnModelCreatingPartial(modelBuilder);

    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}