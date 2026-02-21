using Core.Models;

namespace API.Services
{
     public interface IGameSessionService
    {
        Task<GameSession> CreateGameAsync(string? Code = null, string? RedTeamName = null, string? BlueTeamName = null);
        Task<GameSession> GetGameByIdAsync(string gameCode);
        Task<GameSession> StartGameAsync(string gameCode);
        Task<GameSession> EndGameAsync(string gameCode);
        Task<IEnumerable<GameSession>> GetAllActiveGamesAsync();
    }
}