using API.Services;
using AutoMapper;
using Core.Enums;
using Core.Models;
using Persistence.Entities;
using Persistence.Repositories;
using System.Text.Json;


namespace API.Services
{
    public class GameSessionService : IGameSessionService
    {
        private readonly IGameSessionRepository _gameRepository;
        private readonly IGameSessionManager _gameSessionManager;
        private static readonly Random _random = new();
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

        public async Task<GameSession> CreateGameAsync(string? Code = null, string? RedTeamName = null, string? BlueTeamName = null)
        {
            try
            {
                var redTeam = new Team
                {
                    Name = RedTeamName ?? "Red Team",
                    Color = TeamColor.Red,
                    Score = 0,
                    Members = []
                };

                var blueTeam = new Team
                {
                    Name = BlueTeamName ?? "Blue Team",
                    Color = TeamColor.Blue,
                    Score = 0,
                    Members = []
                };

                var board = GenerateBoard();

                var gameSession = new GameSession
                {
                    Code = Code ?? GenerateGameCode(),
                    Status = GameStatus.Waiting,
                    RedTeam = redTeam,
                    BlueTeam = blueTeam,
                    Board = board,
                    StartTime = DateTime.UtcNow,
                    Players = [], // TODO razmisli da dodas ovo radi lakse logike
                    GuessHistory = [],
                    HintHistory = []
                };

                var gameEntity = _mapper.Map<GameSessionEntity>(gameSession);
                await _gameRepository.AddAsync(gameEntity);
                await _gameRepository.SaveChangesAsync();

                //var createdGame = await _gameRepository.GetByIdAsync(gameSession.Id); // TODO
                //var result = _mapper.Map<GameSession>(createdGame);

                //return result;
                return gameSession;
            }
            catch(Exception ex)
            {
                throw;
            }
        }

        public async Task<GameSession> EndGameAsync(string gameCode)
        {
            try
            {
                var game = _gameSessionManager.GetActiveGame(gameCode);

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
                _gameSessionManager.RemoveActiveGame(gameCode);

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

        public async Task<GameSession> GetGameByIdAsync(string gameCode)
        {
            try
            {
                var gameEntity = await _gameRepository.GetGameWithBoardAndTeamsAsync(0); // TODO

                if (gameEntity == null)
                {
                    throw new InvalidOperationException($"Game with id: '{gameCode}' not found");
                }

                var result = _mapper.Map<GameSession>(gameEntity);
                return result;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<GameSession> StartGameAsync(string gameCode)
        {
            try
            {
                var gameEntity = await _gameRepository.GetGameWithBoardAndTeamsAsync(0); // TODO

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
                game.CurrentTeam = random.Next(2) == 0 ? TeamColor.Red : TeamColor.Blue; // TODO ko prvi igra?
                game.Status = GameStatus.Active;

                // 3. -îuva u bazi
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
            var filePath = Path.GetFullPath(
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "core", "words", "words.json")
            );

            if (!File.Exists(filePath))
                throw new FileNotFoundException($"words.json not found at: {filePath}");

            var json = File.ReadAllText(filePath);

            using var doc = JsonDocument.Parse(json);

            var words = doc.RootElement
                .GetProperty("words")
                .EnumerateArray()
                .Select(x => x.GetString())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToList()!;

            if (words.Count < 25)
                throw new Exception("Not enough words in words.json");

            var random = new Random();

            // uzmi 25 random reci
            var selectedWords = words
                .OrderBy(x => random.Next())
                .Take(25)
                .ToList();

            // odredi koji tim pocinje
            var startingTeam = random.Next(2) == 0 ? TeamColor.Red : TeamColor.Blue;

            // raspodela boja
            var colors = new List<TeamColor>();

            if (startingTeam == TeamColor.Red)
            {
                colors.AddRange(Enumerable.Repeat(TeamColor.Red, 9));
                colors.AddRange(Enumerable.Repeat(TeamColor.Blue, 8));
            }
            else
            {
                colors.AddRange(Enumerable.Repeat(TeamColor.Blue, 9));
                colors.AddRange(Enumerable.Repeat(TeamColor.Red, 8));
            }

            colors.AddRange(Enumerable.Repeat(TeamColor.Neutral, 7));
            colors.Add(TeamColor.Bomb);

            // promesaj boje
            colors = colors.OrderBy(x => random.Next()).ToList();

            var board = new Board();

            for (int i = 0; i < 25; i++)
            {
                board.Cards.Add(new Card
                {
                    Position = i,
                    Word = selectedWords[i]!,
                    TeamColor = colors[i],
                    IsRevealed = false
                });
            }

            return board;
        }
    
        private String GenerateGameCode()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
    
            return new string(Enumerable
                .Repeat(chars, 8)
                .Select(s => s[_random.Next(s.Length)])
                .ToArray());
                

            // TODO
            // string code;
            // do
            // {
            //     code = GenerateGameCode();
            // }
            // while (await _context.Games.AnyAsync(g => g.Code == code));

            // return code;
        }
            
    }
}