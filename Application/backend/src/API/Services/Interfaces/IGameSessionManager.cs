using Core.Models;

namespace API.Services
{
    public interface IGameSessionManager
    {
        void AddActiveGame(GameSession game);
        GameSession GetActiveGame(int gameId);
        void RemoveActiveGame(int gameId);
        IEnumerable<GameSession> GetAllActiveGames();
        bool IsGameActive(int gameId);
        int GetActiveGameCount();
    }
}