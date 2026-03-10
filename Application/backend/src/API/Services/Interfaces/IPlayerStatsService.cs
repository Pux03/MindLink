using API.DTOs.Response;

namespace API.Services
{
    public interface IPlayerStatsService
    {
        Task<PlayerStatsDto> GetPlayerStatsAsync(int userId);
        Task<LeaderboardDto> GetLeaderboardAsync();
    }
}