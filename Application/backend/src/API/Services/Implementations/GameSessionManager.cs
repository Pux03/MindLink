using System.Collections.Concurrent;
using Core.Models;

namespace API.Services
{   
    /// <summary>
    /// Singleton class, only one per app
    /// </summary>
    public class GameSessionManager : IGameSessionManager
    {
        private readonly ConcurrentDictionary<string, GameSession> _activeGames;
        private readonly ILogger<GameSessionManager> _logger;

        public GameSessionManager(
            ILogger<GameSessionManager> logger
        )
        {
            _activeGames = new ConcurrentDictionary<string, GameSession>();
            _logger = logger;
        }

        public void AddActiveGame(GameSession game)
        {
            if (game == null)
            {
                _logger.LogWarning("Attempted to add null game session");
                return;
            }

            if (_activeGames.TryAdd(game.Code, game))
            {
                _logger.LogInformation("Game added {@Data}", new { GameCode = game.Code, ActiveGames = _activeGames.Count });
            } 
            else
            {
                _logger.LogWarning("Game already exists {@Data}", new { GameCode = game.Code });
            }
        }

        public GameSession? GetActiveGame(string gameCode)
        {
            _activeGames.TryGetValue(gameCode, out var game);

            if (game == null)
            {
                _logger.LogWarning("Game not found {@Data}", new { GameCode = gameCode });
            } 

            return game;
        }

        public int GetActiveGameCount()
        {
            return _activeGames.Count;
        }

        public IEnumerable<GameSession> GetAllActiveGames()
        {
            return _activeGames.Values;
        }

        public bool IsGameActive(string gameCode)
        {
            return _activeGames.ContainsKey(gameCode);
        }

        public void RemoveActiveGame(string gameCode)
        {
            if (_activeGames.TryRemove(gameCode, out var game))
            {
                 _logger.LogInformation("Game successfully removed {@Data}", new { GameCode = gameCode, ActiveGames = _activeGames.Count });
            }
            else
            {
                _logger.LogWarning("Game not found for removal {@Data}", new { GameCode = gameCode });
            }
        }
    }
}