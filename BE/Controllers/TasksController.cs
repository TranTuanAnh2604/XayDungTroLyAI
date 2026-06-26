using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Assistant.DTOs;
using Assistant.Wrappers;
using Assistant.Models;
using TaskModel = Assistant.Models.Task; 
namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TasksController(AppDbContext context)
        {
            _context = context;
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
            Console.WriteLine($"Request Status: {request.Status}");
            var task = new TaskModel
            {
                UserId = GetUserId(),
                Title = request.Title,
                Description = request.Description,
                Priority = request.Priority,
                DueDate = request.DueDate,
                Status = request.Status ?? "pending",
                InputMethod = "text",
                CreatedAt = DateTime.UtcNow
            };

            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<Guid>(task.Id, "Tạo công việc mới thành công!"));
        }

        [HttpPut("{id}/complete")]
        public async Task<IActionResult> MarkAsCompleted(Guid id)
        {
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == GetUserId());
            if (task == null) return NotFound(new ApiResponse<string>("Không tìm thấy công việc!"));

            task.Status = "done";
            task.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponse<bool>(true, "Đã đánh dấu hoàn thành!"));
        }
        // Sửa công việc
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask( Guid id,[FromBody] UpdateTaskDto request)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.UserId == GetUserId());

            if (task == null)
                return NotFound();

            task.Title = request.Title;
            task.Description = request.Description;
            task.Priority = request.Priority;
            task.Status = request.Status;
            task.DueDate = request.DueDate;

            await _context.SaveChangesAsync();

            return Ok(
                new ApiResponse<bool>(
                    true,
                    "Cập nhật công việc thành công!"
                )
            );
        }
        //Xoá công việc
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(Guid id)
        {
            var task = await _context.Tasks
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.UserId == GetUserId());

            if (task == null)
                return NotFound();

            _context.Tasks.Remove(task);

            await _context.SaveChangesAsync();

            return Ok(
                new ApiResponse<bool>(
                    true,
                    "Xóa công việc thành công!"
                )
            );
        }
        //Cập nhật trạng thái
        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(Guid id,[FromBody] UpdateTaskStatusDto request)
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
                task.CompletedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(
                new ApiResponse<bool>(
                    true,
                    "Cập nhật trạng thái thành công!"
                )
            );
        }
    }
}