using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Assistant.Services;
using Assistant.Wrappers;

namespace Assistant.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class VoiceController : ControllerBase
    {
        private readonly GroqService _groqService;

        public VoiceController(GroqService groqService)
        {
            _groqService = groqService;
        }

        [HttpPost("process")]
        public async Task<IActionResult> ProcessVoice([FromBody] VoiceRequestDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
                return BadRequest(new ApiResponse<string>("Không nhận được nội dung giọng nói!"));

            try
            {
                var aiReply = await _groqService.ChatAsync(request.Text);
                return Ok(new ApiResponse<string>(aiReply, "AI đã phản hồi!"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<string>($"Lỗi xử lý AI: {ex.Message}"));
            }
        }
    }

    public class VoiceRequestDto
    {
        public string Text { get; set; } = null!;
    }
}