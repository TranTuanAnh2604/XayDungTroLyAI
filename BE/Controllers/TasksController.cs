using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Assistant.DTOs;
using Assistant.Wrappers;
using Assistant.Models;
using Assistant.Services;
using TaskModel = Assistant.Models.Task;
namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ScheduleConflictService _conflict;

        public TasksController(AppDbContext context, ScheduleConflictService conflict)
        {
            _context = context;
            _conflict = conflict;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

        [HttpGet]
        public async Task<IActionResult> GetMyTasks()
        {
            var userId = GetUserId();
            var tasks = await _context.Tasks
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.Priority)
                .Select(t => new TaskDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Priority = t.Priority,
                    Status = t.Status,
                    DueDate = t.DueDate
                })
                .ToListAsync();

            return Ok(new ApiResponse<List<TaskDto>>(tasks, "Lấy danh sách công việc thành công!"));
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto request)
        {
            var userId = GetUserId();
            Console.WriteLine($"Request Status: {request.Status}");

            if (request.DueDate.HasValue)
            {
                var start = request.DueDate.Value;
                var end = start.AddMinutes(30);

                if (!request.IgnoreConflict)
                {
                    var conflicts = await _conflict.FindConflictsAsync(userId, start, end);
                    if (conflicts.Count > 0)
                    {
                        return Conflict(new { conflict = true, message = "Trùng giờ với lịch/task khác. Vẫn muốn tạo?", conflicts });
                    }
                }
            }

            var task = new TaskModel
            {
                UserId = userId,
                Title = request.Title,
                Description = request.Description,
                Priority = request.Priority,
                DueDate = request.DueDate.HasValue ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc) : null,
                Status = request.Status ?? "pending",
                InputMethod = "text",
                CreatedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc),
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<Guid>(task.Id, "Tạo công việc mới thành công!"));
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateTaskStatusDto request)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.UserId == GetUserId());

            if (task == null)
                return NotFound();

            task.Status = request.Status;

            if (request.Status == "done")
            {
                task.CompletedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);
            }

            await _context.SaveChangesAsync();

            return Ok(
                new ApiResponse<bool>(
                    true,
                    "Cập nhật trạng thái thành công!"
                )
            );
        }

        [HttpPut("{id}/complete")]
        public async Task<IActionResult> MarkAsCompleted(Guid id)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
            if (task == null) return NotFound(new ApiResponse<string>("Không tìm thấy công việc!"));

            task.Status = "done";
            task.CompletedAt = DateTime.SpecifyKind(DateTime.UtcNow.AddHours(7), DateTimeKind.Utc);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>(true, "Đã đánh dấu hoàn thành!"));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(Guid id, [FromBody] UpdateTaskDto request)
        {
            var userId = GetUserId();
            var task = await _context.Tasks
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.UserId == userId);

            if (task == null)
                return NotFound();

            if (request.DueDate.HasValue)
            {
                var start = request.DueDate.Value;
                var end = start.AddMinutes(30);

                if (!request.IgnoreConflict)
                {
                    // excludeEventId = task.CalendarEventId: nếu task này gốc từ 1 Event, loại event đó
                    // ra khỏi danh sách trùng, tránh tự báo trùng với chính event liên kết của nó.
                    var conflicts = await _conflict.FindConflictsAsync(userId, start, end, excludeEventId: task.CalendarEventId, excludeTaskId: id);
                    if (conflicts.Count > 0)
                    {
                        return Conflict(new { conflict = true, message = "Trùng giờ với lịch/task khác. Vẫn muốn lưu?", conflicts });
                    }
                }
            }

            task.Title = request.Title;
            task.Description = request.Description;
            task.Priority = request.Priority;
            task.Status = request.Status;
            task.DueDate = request.DueDate.HasValue ? DateTime.SpecifyKind(request.DueDate.Value, DateTimeKind.Utc) : null;

            if (task.CalendarEventId.HasValue && request.DueDate.HasValue)
            {
                var linkedEvent = await _context.CalendarEvents.FirstOrDefaultAsync(e => e.Id == task.CalendarEventId.Value);
                if (linkedEvent != null)
                {
                    linkedEvent.Title = request.Title;
                    linkedEvent.Description = request.Description;
                    linkedEvent.StartTime = request.DueDate.Value;
                    linkedEvent.EndTime = request.DueDate.Value.AddMinutes(30);
                    linkedEvent.Priority = PriorityMapper.TaskToCalendar(request.Priority);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(
                new ApiResponse<bool>(
                    true,
                    "Cập nhật công việc thành công!"
                )
            );
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(Guid id)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.UserId == GetUserId());

            if (task == null)
                return NotFound();

            if (task.CalendarEventId.HasValue)
            {
                var linkedEvent = await _context.CalendarEvents.FirstOrDefaultAsync(e => e.Id == task.CalendarEventId.Value);
                if (linkedEvent != null) _context.CalendarEvents.Remove(linkedEvent);
            }

            _context.Tasks.Remove(task);

            await _context.SaveChangesAsync();

            return Ok(
                new ApiResponse<bool>(
                    true,
                    "Xóa công việc thành công!"
                )
            );
        }
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetTaskById(Guid id)
        {
            var userId = GetUserId();
            var task = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

            if (task == null)
                return NotFound(new ApiResponse<string>("Không tìm thấy công việc!"));

            return Ok(new ApiResponse<TaskDto>(new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                Priority = task.Priority,
                Status = task.Status,
                DueDate = task.DueDate
            }, "Lấy công việc thành công!"));
        }
    }
}