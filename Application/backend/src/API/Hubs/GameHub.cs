using Microsoft.AspNetCore.SignalR;
using Core.Models;
using Core.Events;
using API.Services;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace API.Hubs
{
    /// <summary>
    /// GameHub - Glavna WebSocket konekcija
    /// 1. Prima akcije od React-a (invoke)
    /// 2. Poziva servise
    /// 3. Servisi emituju event-e na RabbitMQ
    /// 4. Consumer prima event-e i signalizira kroz Hub
    /// 5. React dobija signale u realnom vremenu
    /// </summary>
    public class GameHub : Hub<IGameHubClient>
    {
        private readonly IGameSessionService _gameSessionService;
        private readonly IGameLogicService _gameLogicService;
        private readonly IGameSessionManager _gameSessionManager;
        private readonly IMapper _mapper;
        private readonly ILogger<GameHub> _logger;

        public GameHub(
            IGameSessionService gameSessionService,
            IGameLogicService gameLogicService,
            IGameSessionManager gameSessionManager,
            IMapper mapper,
            ILogger<GameHub> logger
        )
        {
            _gameSessionService = gameSessionService;
            _gameLogicService = gameLogicService;
            _gameSessionManager = gameSessionManager;
            _mapper = mapper;
            _logger = logger;
        }

        /// <summary>
        /// React connects to the Hub
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"Client {Context.ConnectionId} connected");
            await base.OnConnectedAsync();
        }

        /// <summary>
        /// React disconnects from gub
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception exception)
        {
            _logger.LogInformation($"Client {Context.ConnectionId} disconnected");
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// React: connection.invoke("CreateGame", { gameName, playerName })
        /// </summary>
        public async Task CreateGame(string gameName, string playerName)
        {
            try
            {
                _logger.LogInformation($"CreateGame: {gameName}");

                var game = await _gameSessionService.CreateGameAsync(gameName, 1, 2);

                var player = new Player
                {
                    Username = playerName,
                    IsPlaying = true,
                    Team = game.RedTeam,
                    IsMindreader = false
                };

                game.Players.Add(player);
                game.RedTeam.Members.Add(player);
                await Groups.AddToGroupAsync(Context.ConnectionId, $"game_{game.Id}");

                await Clients.Caller.GameCreated(new
                {
                    GameId = game.Id,
                    GameName = game.Name,
                    CreatorName = playerName
                });

                // Consumer će emitovati ostatku klijenata!
                _logger.LogInformation($"Game {game.Id} created");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in CreateGame: {ex.Message}");
                await Clients.Caller.Error(ex.Message);
            }
        }

        /// <summary>
        /// React: connection.invoke("JoinGame", gameId)
        /// </summary>
        public async Task JoinGame(int gameId, string playerName)
        {
            try
            {
                _logger.LogInformation($"JoinGame: player {playerName} joined game {gameId}");

                var game = _gameSessionManager.GetActiveGame(gameId);

                if (game == null)
                {
                    await Clients.Caller.Error("Game not found");
                    return;
                }

                // Kreiraj igrača
                var player = new Player
                {
                    Username = playerName,
                    IsPlaying = true,
                    Team = game.BlueTeam,
                    IsMindreader = false
                };

                game.Players.Add(player);
                game.BlueTeam.Members.Add(player);

                // Dodaj u grupu
                await Groups.AddToGroupAsync(Context.ConnectionId, $"game_{gameId}");

                // Signalizira samo u toj grupi
                await Clients.Group($"game_{gameId}")
                    .PlayerJoined( new
                    {
                        PlayerName = playerName,
                        TotalPlayers = game.Players.Count
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error u JoinGame: {ex.Message}");
                await Clients.Caller.Error(ex.Message);
            }
        }

        /// <summary>
        /// React: connection.invoke("ExecuteGuess", gameId, cardPosition)
        /// </summary>
        public async Task ExecuteGuess(int gameId, int cardPosition)
        {
            try
            {
                _logger.LogInformation($"ExecuteGuess: game={gameId}, card={cardPosition}");

                var game = _gameSessionManager.GetActiveGame(gameId);

                if (game == null)
                {
                    await Clients.Caller.Error("Game not found");
                    return;
                }

                // TODO: Pronađi Player-a iz Context-a (kad se implementira auth)
                var player = game.Players.FirstOrDefault();

                if (player == null)
                {
                    await Clients.Caller.Error("Player not found");
                    return;
                }

                // Pozovi GameLogicService
                var guessEvent = await _gameLogicService.ExecuteGuessAsync(
                    game,
                    player,
                    cardPosition);

                // GameLogicService će emitovati event na RabbitMQ!
                // Consumer će signalizirati grupi kroz Hub

                // Signalizira pozivajućem igraču odmah
                await Clients.Caller.GuessResult(new
                {
                    IsCorrect = guessEvent.IsCorrect,
                    CardWord = guessEvent.CardWord
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error in ExecuteGuess: {ex.Message}");
                await Clients.Caller.Error(ex.Message);
            }
        }

        /// <summary>
        /// React: connection.invoke("GiveHint", gameId, word, wordCount)
        /// </summary>
        public async Task GiveHint(int gameId, string word, int wordCount)
        {
            try
            {
                _logger.LogInformation($"GiveHint: {word} ({wordCount})");

                var game = _gameSessionManager.GetActiveGame(gameId);

                if (game == null)
                {
                    await Clients.Caller.Error("Game not found");
                    return;
                }

                // TODO: Pronađi Mind Reader-a
                var mindReader = game.Players.FirstOrDefault(p => p.IsMindreader);

                if (mindReader == null)
                {
                    await Clients.Caller.Error("Mind Reader not found");
                    return;
                }

                // Pozovi GameLogicService
                var hintEvent = await _gameLogicService.GiveHintAsync(
                    game,
                    mindReader,
                    word,
                    wordCount);

                // Signalizira grupi
                 await Clients.Group($"game_{gameId}")
                    .HintGiven(new
                    {
                        Word = word,
                        WordCount = wordCount
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error u GiveHint: {ex.Message}");
                await Clients.Caller.Error(ex.Message);
            }
        }

        /// <summary>
        /// React: connection.invoke("StartGame", gameId)
        /// </summary>
        // public async Task StartGame(int gameId)
        // {
        //     try
        //     {
        //         _logger.LogInformation($"StartGame: {gameId}");

        //         var game = await _gameSessionService.StartGameAsync(gameId);

        //         // GameSessionService ce emitovati event na RabbitMQ!

        //         // Signalizira grupi
        //         await Clients.Group($"game_{gameId}")
        //             .SendAsync("GameStarted", new
        //             {
        //                 FirstTeam = game.CurrentTeam.ToString()
        //             });
        //     }
        //     catch (Exception ex)
        //     {
        //         _logger.LogError($"Greška u StartGame: {ex.Message}");
        //         await Clients.Caller.SendAsync("Error", ex.Message);
        //     }
        // }

        /// <summary>
        /// React: connection.invoke("StartGame", gameId)
        /// </summary>
        public async Task StartGame(int gameId)
        {
            try
            {
                _logger.LogInformation($"StartGame: {gameId}");

                var game = await _gameSessionService.StartGameAsync(gameId);

                // ← Koristi GameStarted umesto SendAsync!
                await Clients.Group($"game_{gameId}")
                    .GameStarted(new
                    {
                        FirstTeam = game.CurrentTeam.ToString()
                    });

                _logger.LogInformation($"✅ Partija {gameId} je počela");
            }
            catch (Exception ex)
            {
                _logger.LogError($"❌ Greška u StartGame: {ex.Message}");
                await Clients.Caller.Error(ex.Message);
            }
        }

        /// <summary>
        /// React: connection.invoke("UpdateTeam", gameId, playerId, teamColor, isMindreader)
        /// </summary>
        public async Task UpdateTeam(int gameId, int playerId, string teamColor, bool isMindreader)
        {
            try
            {
                _logger.LogInformation($"UpdateTeam: {playerId} → {teamColor}");

                var game = _gameSessionManager.GetActiveGame(gameId);

                if (game == null)
                {
                    await Clients.Caller.Error("Partija nije pronađena");
                    return;
                }

                var player = game.Players.FirstOrDefault(p => p.Id == playerId);

                if (player == null)
                {
                    await Clients.Caller.Error("Player not found");
                    return;
                }

                // Ukloni iz starog tima
                game.RedTeam.Members.Remove(player);
                game.BlueTeam.Members.Remove(player);

                // Dodaj u novi tim
                var newTeam = teamColor.ToLower() == "red" ? game.RedTeam : game.BlueTeam;
                newTeam.Members.Add(player);
                player.Team = newTeam;
                player.IsMindreader = isMindreader;

                // ← Koristi PlayerTeamChanged umesto SendAsync!
                await Clients.Group($"game_{gameId}")
                    .PlayerTeamChanged(new
                    {
                        PlayerId = playerId,
                        PlayerName = player.Username,
                        NewTeam = teamColor,
                        IsMindreader = isMindreader
                    });

                _logger.LogInformation($"Player {player.Username} changed team");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error UpdateTeam: {ex.Message}");
                await Clients.Caller.Error(ex.Message);
            }
        }
    }
}