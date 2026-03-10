using Microsoft.AspNetCore.Mvc;
using API.DTOs.Response;
using API.Services;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class StatsController : ControllerBase
    {
        private readonly IPlayerStatsService _playerStatsService;
        private readonly ILogger<StatsController> _logger;

        public StatsController(IPlayerStatsService playerStatsService, ILogger<StatsController> logger)
        {
            _playerStatsService = playerStatsService;
            _logger = logger;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PlayerStatsDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<PlayerStatsDto>>> GetStats()
        {
            try
            {
                var stats = await _playerStatsService.GetPlayerStatsAsync(GetCurrentUserId());
                return Ok(new ApiResponse<PlayerStatsDto>
                {
                    Success = true,
                    Message = "Stats found",
                    Data = stats
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetStats: {ex.Message}");
                return StatusCode(500, new ApiResponse<PlayerStatsDto>
                {
                    Success = false,
                    Message = "Internal server error",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet("leaderboard")]
        [AllowAnonymous]
        [ProducesResponseType(typeof(ApiResponse<LeaderboardDto>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<LeaderboardDto>>> GetLeaderboard()
        {
            try
            {
                var leaderboard = await _playerStatsService.GetLeaderboardAsync();
                return Ok(new ApiResponse<LeaderboardDto>
                {
                    Success = true,
                    Message = "Leaderboard found",
                    Data = leaderboard
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in GetLeaderboard: {ex.Message}");
                return StatusCode(500, new ApiResponse<LeaderboardDto>
                {
                    Success = false,
                    Message = "Internal server error",
                    Errors = new List<string> { ex.Message }
                });
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