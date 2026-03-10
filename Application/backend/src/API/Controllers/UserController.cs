using Microsoft.AspNetCore.Mvc;
using API.DTOs.Request;
using API.Services;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<UserController> _logger;

        public UserController(IUserService userService, ILogger<UserController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpPut("username")]
        public async Task<IActionResult> UpdateUsername([FromBody] UpdateUsernameRequest request)
        {
            try
            {
                await _userService.UpdateUsernameAsync(GetCurrentUserId(), request.NewUsername);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in UpdateUsername: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("password")]
        public async Task<IActionResult> UpdatePassword([FromBody] UpdatePasswordRequest request)
        {
            try
            {
                await _userService.UpdatePasswordAsync(GetCurrentUserId(), request.CurrentPassword, request.NewPassword);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in UpdatePassword: {ex.Message}");
                return StatusCode(500, "Internal server error");
            }
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst("id");
            if (claim == null)
                throw new UnauthorizedAccessException("User not authenticated");
            return int.Parse(claim.Value);
        }
    }
}