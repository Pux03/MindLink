using Core.Models;

namespace API.Services
{
    public interface IGameSessionManager
    {
        void AddActiveGame(GameSession game);
        GameSession GetActiveGame(string gameCode);
        void RemoveActiveGame(string gameCode);
        IEnumerable<GameSession> GetAllActiveGames();
        bool IsGameActive(string gameCode);
        int GetActiveGameCount();
    }
}