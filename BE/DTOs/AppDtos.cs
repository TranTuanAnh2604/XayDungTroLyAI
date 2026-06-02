namespace Assistant.DTOs
{
    // --- DTO CHO USER (Dùng cho UsersController) ---
    public class UserProfileDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Timezone { get; set; } = null!;
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
        public byte Priority { get; set; } = 2; // 1=Thấp, 2=TB, 3=Cao, 4=Khẩn
        public DateTime? DueDate { get; set; }
    }
}