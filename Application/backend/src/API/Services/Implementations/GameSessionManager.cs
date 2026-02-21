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

        public GameSessionManager(
            // ILogger<GameSessionManager> logger
        )
        {
            _activeGames = new ConcurrentDictionary<string, GameSession>();
            // _logger = logger;
        }

        public void AddActiveGame(GameSession game)
        {
            if (game == null)
            {
                return;
            }

            if (_activeGames.TryAdd(game.Code, game))
            {
                // Uspesno
            } 
            else
            {
                // Nije uspesno
            }
        }

        public GameSession GetActiveGame(string gameCode)
        {
            _activeGames.TryGetValue(gameCode, out var game);

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

        public bool IsGameActive(string gameCode)
        {
            return _activeGames.ContainsKey(gameCode);
        }

        public void RemoveActiveGame(string gameCode)
        {
            if (_activeGames.TryRemove(gameCode, out var game))
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