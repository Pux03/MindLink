using Core.Models;

namespace API.Services
{
     public interface IGameSessionService
    {
        Task<GameSession> CreateGameAsync(string gameName, int redTeamId, int blueTeamId);
        Task<GameSession> GetGameByIdAsync(int gameId);
        Task<GameSession> StartGameAsync(int gameId);
        Task<GameSession> EndGameAsync(int gameId);
        Task<IEnumerable<GameSession>> GetAllActiveGamesAsync();
    }
}