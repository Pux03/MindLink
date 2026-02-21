using Microsoft.AspNetCore.SignalR;
using Core.Models;
using Core.Events;
using API.Services;
using AutoMapper;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace API.Hubs
{
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
            ILogger<GameHub> logger)
        {
            _gameSessionService = gameSessionService;
            _gameLogicService = gameLogicService;
            _gameSessionManager = gameSessionManager;
            _mapper = mapper;
            _logger = logger;
        }

        public override async Task OnConnectedAsync()
        {
            _logger.LogInformation($"Client {Context.ConnectionId} connected");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            _logger.LogInformation($"Client {Context.ConnectionId} disconnected");
            await base.OnDisconnectedAsync(exception);
        }

        /// <summary>
        /// Poziva se nakon što REST /join uspe — samo notifikacija grupi
        /// React: connection.invoke("JoinGame", gameCode)
        /// </summary>
        public async Task JoinGame(string gameCode)
        {
            try
            {
                var game = _gameSessionManager.GetActiveGame(gameCode);

                if (game == null)
                {
                    await Clients.Caller.Error("Game not found");
                    return;
                }

                if (game.Players.Count >= game.MaxPlayers)
                {
                    await Clients.Caller.Error("Game is full");
                    return;
                }

                await Groups.AddToGroupAsync(Context.ConnectionId, $"game_{gameCode}");

                await Clients.Group($"game_{gameCode}")
                    .PlayerJoined(new
                    {
                        UserId = GetCurrentUserId(),
                        TotalPlayers = game.Players.Count
                    });

                _logger.LogInformation($"Player {GetCurrentUserId()} joined game {gameCode}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error u JoinGame: {ex.Message}");
                await Clients.Caller.Error(ex.Message);
            }
        }

        /// <summary>
        /// React: connection.invoke("UpdateTeam", gameCode, playerId, teamColor, isMindreader)
        /// </summary>
        public async Task UpdateTeam(string gameCode, int playerId, string teamColor, bool isMindreader)
        {
            try
            {
                _logger.LogInformation($"UpdateTeam: {playerId} → {teamColor}");

                var game = _gameSessionManager.GetActiveGame(gameCode);

                if (game == null)
                {
                    await Clients.Caller.Error("Game not found");
                    return;
                }

                var player = game.Players.FirstOrDefault(p => p.Id == playerId);

                if (player == null)
                {
                    await Clients.Caller.Error("Player not found");
                    return;
                }

                game.RedTeam.Members.Remove(player);
                game.BlueTeam.Members.Remove(player);

                var newTeam = teamColor.ToLower() == "red" ? game.RedTeam : game.BlueTeam;
                newTeam.Members.Add(player);
                player.Team = newTeam;
                player.IsMindreader = isMindreader;

                await Clients.Group($"game_{gameCode}")
                    .PlayerTeamChanged(new
                    {
                        PlayerId = playerId,
                        PlayerName = player.GetUsername(),
                        NewTeam = teamColor,
                        IsMindreader = isMindreader
                    });

                _logger.LogInformation($"Player {player.GetUsername()} changed team to {teamColor}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error UpdateTeam: {ex.Message}");
                await Clients.Caller.Error(ex.Message);
            }
        }

        /// <summary>
        /// React: connection.invoke("StartGame", gameCode)
        /// </summary>
        public async Task StartGame(string gameCode)
        {
            try
            {
                _logger.LogInformation($"StartGame: {gameCode}");

                var game = await _gameSessionService.StartGameAsync(gameCode);

                await Clients.Group($"game_{gameCode}")
                    .GameStarted(new
                    {
                        FirstTeam = game.CurrentTeam.ToString()
                    });

                _logger.LogInformation($"Partija {gameCode} je počela");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Greška u StartGame: {ex.Message}");
                await Clients.Caller.Error(ex.Message);
            }
        }

        /// <summary>
        /// React: connection.invoke("ExecuteGuess", gameCode, cardPosition)
        /// </summary>
        public async Task ExecuteGuess(string gameCode, int cardPosition)
        {
            try
            {
                _logger.LogInformation($"ExecuteGuess: game={gameCode}, card={cardPosition}");

                var game = _gameSessionManager.GetActiveGame(gameCode);

                if (game == null)
                {
                    await Clients.Caller.Error("Game not found");
                    return;
                }

                var currentUserId = GetCurrentUserId();
                var player = game.Players.FirstOrDefault(p => p.UserId == currentUserId);

                if (player == null)
                {
                    await Clients.Caller.Error("Player not found");
                    return;
                }

                var guessEvent = await _gameLogicService.ExecuteGuessAsync(game, player, cardPosition);

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
        /// React: connection.invoke("GiveHint", gameCode, word, wordCount)
        /// </summary>
        public async Task GiveHint(string gameCode, string word, int wordCount)
        {
            try
            {
                _logger.LogInformation($"GiveHint: {word} ({wordCount})");

                var game = _gameSessionManager.GetActiveGame(gameCode);

                if (game == null)
                {
                    await Clients.Caller.Error("Game not found");
                    return;
                }

                var currentUserId = GetCurrentUserId();
                var mindReader = game.Players.FirstOrDefault(p => p.UserId == currentUserId && p.IsMindreader);

                if (mindReader == null)
                {
                    await Clients.Caller.Error("Mind Reader not found");
                    return;
                }

                var hintEvent = await _gameLogicService.GiveHintAsync(game, mindReader, word, wordCount);

                await Clients.Group($"game_{gameCode}")
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

        private int GetCurrentUserId()
        {
            var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier);
            if (claim == null)
                throw new UnauthorizedAccessException("User not authenticated");
            return int.Parse(claim.Value);
        }
    }
}