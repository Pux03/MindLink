using System.Collections.Concurrent;
using Core.Models;

namespace API.Services
{   
    /// <summary>
    /// Singleton class, only one per app
    /// </summary>
    public class GameSessionManager : IGameSessionManager
    {
        private readonly ConcurrentDictionary<int, GameSession> _activeGames;

        public GameSessionManager(
            // ILogger<GameSessionManager> logger
        )
        {
            _activeGames = new ConcurrentDictionary<int, GameSession>();
            // _logger = logger;
        }

        public void AddActiveGame(GameSession game)
        {
            if (game == null)
            {
                return;
            }

            if (_activeGames.TryAdd(game.Id, game))
            {
                // Uspesno
            } 
            else
            {
                // Nije uspesno
            }
        }

        public GameSession GetActiveGame(int gameId)
        {
            _activeGames.TryGetValue(gameId, out var game);

            if (game != null)
            {
                // Uspesno
            } 
            else
            {
                // Nije uspesno
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

        public bool IsGameActive(int gameId)
        {
            return _activeGames.ContainsKey(gameId);
        }

        public void RemoveActiveGame(int gameId)
        {
            if (_activeGames.TryRemove(gameId, out var game))
            {
                // Uspesno pronadjena i obrisana
            }
            else
            {
                // Nije pronadjena igra sa tim Id-om
            }
        }
    }
}