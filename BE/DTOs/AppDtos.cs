namespace Assistant.DTOs
{
    // --- DTO CHO USER (Dùng cho UsersController) ---
    public class UserProfileDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Timezone { get; set; } = null!;
        public string? AvatarUrl { get; set; }
    }

    public class UpdateProfileDto
    {
        public string Name { get; set; } = null!;
        public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";
    }

    public class UserMemoryDto
    {
        public string Category { get; set; } = null!; // VD: 'preference', 'habit'
        public string Key { get; set; } = null!;      // VD: 'coffee_type'
        public string Value { get; set; } = null!;    // VD: 'Cà phê đen'
    }

    // --- DTO CHO TASK (Dùng cho TasksController) ---
    public class TaskDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public byte Priority { get; set; }
        public string Status { get; set; } = null!;
        public DateTime? DueDate { get; set; }
    }

    public class CreateTaskDto
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public byte Priority { get; set; } = 2; // 1=Thấp, 2=TB, 3=Khẩn
        public DateTime? DueDate { get; set; }
    }
    // Cập nhật sau khi hoàn thành công việc
    public class UpdateTaskDto
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public byte Priority { get; set; }
        public string Status { get; set; } = null!;
        public DateTime? DueDate { get; set; }
    }

    public class UpdateTaskStatusDto
    {
        public string Status { get; set; } = null!;
    }

    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = null!;
        public string? Body { get; set; }
        public string Type { get; set; } = "reminder";
        public DateTime ScheduledAt { get; set; }
        public DateTime? SentAt { get; set; }
        public string Status { get; set; } = "pending";
    }

    public class CreateNotificationDto
    {
        public string Title { get; set; } = null!;
        public string? Body { get; set; }
        public DateTime ScheduledAt { get; set; }
    }
    public class AiSuggestDto
    {
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public byte Priority { get; set; }
        public DateTime? DueDate { get; set; }
    }

    public class AiSuggestionResult
    {
        public DateTime ScheduledAt { get; set; }
        public string Reason { get; set; } = null!;
    }

    // Models để parse response từ Anthropic API
    public class AnthropicResponse
    {
        public List<AnthropicContent>? Content { get; set; }
    }

    public class AnthropicContent
    {
        public string? Text { get; set; }
    }
}