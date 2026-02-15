using API.Services;
using AutoMapper;
using Core.Enums;
using Core.Models;
using Persistence.Entities;
using Persistence.Repositories;

namespace API.Services
{
    public class GameSessionService : IGameSessionService
    {
        private readonly IGameSessionRepository _gameRepository;
        private readonly IGameSessionManager _gameSessionManager;
        private readonly IMapper _mapper;
    
        public GameSessionService(
            IGameSessionRepository gameRepository,
            IGameSessionManager gameSessionManager,
            IMapper mapper
            //ILogger<GameSessionService> logger
            )
        {
            _gameRepository = gameRepository;
            _gameSessionManager = gameSessionManager;
            _mapper = mapper;
            //_logger = logger;
        }

        public async Task<GameSession> CreateGameAsync(string gameName, int redTeamId, int blueTeamId)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(gameName))
                {
                    throw new ArgumentException("Game Name can't be empty!");
                }

                var redTeam = new Team
                {
                    Id = redTeamId,
                    Name = "Red Team",
                    Color = TeamColor.Red,
                    Score = 0,
                    Members = []
                };

                var blueTeam = new Team
                {
                    Id = blueTeamId,
                    Name = "Blue Team",
                    Color = TeamColor.Blue,
                    Score = 0,
                    Members = []
                };

                var board = GenerateBoard();

                var gameSession = new GameSession
                {
                    Name = gameName,
                    Status = GameStatus.Waiting,
                    RedTeam = redTeam,
                    BlueTeam = blueTeam,
                    Board = board,
                    StartTime = DateTime.UtcNow,
                    // Players = new List<Player>(), // TODO razmisli da dodas ovo radi lakse logike
                    GuessHistory = [],
                    HintHistory = []
                };

                var gameEntity = _mapper.Map<GameSessionEntity>(gameSession);
                await _gameRepository.AddAsync(gameEntity);
                await _gameRepository.SaveChangesAsync();

                var createdGame = await _gameRepository.GetByIdAsync(gameSession.Id);
                var result = _mapper.Map<GameSession>(createdGame);

                return result;
            }
            catch(Exception ex)
            {
                throw;
            }
        }

        public async Task<GameSession> EndGameAsync(int gameId)
        {
            try
            {
                var game = _gameSessionManager.GetActiveGame(gameId);

                if (game == null)
                {
                    throw new InvalidOperationException("Game not found");
                }

                // Update status
                game.Status = GameStatus.GameOver;
                game.EndTime = DateTime.UtcNow;

                var gameEntity = _mapper.Map<GameSessionEntity>(game);
                await _gameRepository.UpdateAsync(gameEntity);
                await _gameRepository.SaveChangesAsync();

                // Remove from game session manager
                _gameSessionManager.RemoveActiveGame(gameId);

                return game;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<IEnumerable<GameSession>> GetAllActiveGamesAsync()
        {
            try
            {
                return _gameSessionManager.GetAllActiveGames();
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<GameSession> GetGameByIdAsync(int gameId)
        {
            try
            {
                var gameEntity = await _gameRepository.GetGameWithBoardAndTeamsAsync(gameId);

                if (gameEntity == null)
                {
                    throw new InvalidOperationException($"Game with id: '{gameId}' not found");
                }

                var result = _mapper.Map<GameSession>(gameEntity);
                return result;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<GameSession> StartGameAsync(int gameId)
        {
            try
            {
                var gameEntity = await _gameRepository.GetGameWithBoardAndTeamsAsync(gameId);

                if (gameEntity == null)
                {
                    throw new InvalidOperationException("Game not found");
                }

                var game = _mapper.Map<GameSession>(gameEntity);

                // Validation
                if (game.Status != GameStatus.Waiting)
                {
                    throw new InvalidOperationException("Game has already started");
                }

                if (game.RedTeam.Members.Count != 2 || game.BlueTeam.Members.Count != 2)
                {
                    throw new InvalidOperationException("Both teams must be full");
                }

                // 2. Postavi prvi tim na redu (random)
                var random = new Random();
                game.CurrentTeam = random.Next(2) == 0 ? TeamColor.Red : TeamColor.Blue;
                game.Status = GameStatus.Active;

                // 3. Čuva u bazi
                var updatedGameEntity = _mapper.Map<GameSessionEntity>(game);
                await _gameRepository.UpdateAsync(updatedGameEntity);
                await _gameRepository.SaveChangesAsync();

                // Add to game session manager
                _gameSessionManager.AddActiveGame(game);

                return game;
            }
            catch (Exception ex)
            {
                throw;
            }
        }


        // TODO make it so it reads from JSON file of all available words
        private Board GenerateBoard()
        {
            return null;
        }
    }
}