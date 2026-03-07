using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using Core.Events;
using Microsoft.AspNetCore.SignalR;
using API.Hubs;
using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Logging;

namespace API.MessageQueue
{
    /// <summary>
    /// Consumer -> BackgroundService (always on in the background)
    /// Listens to the RabbitMQ queues and signalizes the Hubs
    /// </summary>
    public class GameEventConsumer : BackgroundService
    {
        private readonly IConnection _connection;
        private readonly IHubContext<GameHub, IGameHubClient> _hubContext;
        private readonly ILogger<GameEventConsumer> _logger;

        private readonly string _exchangeName = "mindlink.games";
        private readonly string _queueName = "game_events_queue";

        public GameEventConsumer
        (
            IConnection connection,
            IHubContext<GameHub, IGameHubClient> hubContext,
            ILogger<GameEventConsumer> logger
        )
        {
            _connection = connection;
            _hubContext = hubContext;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("GameEventConsumer started - listening to RabbitMQ...");

            using var channel = _connection.CreateModel();

            // Configuration - creating exchange and queue

            channel.ExchangeDeclare(
                exchange: _exchangeName,
                type: ExchangeType.Topic,
                durable: true
            );

            channel.QueueDeclare(
                queue: _queueName,
                durable: true,
                exclusive: false,
                autoDelete: false
            );

            // Listens to all game.* event-e
            channel.QueueBind(_queueName, _exchangeName, "game.*");

            _logger.LogInformation($"Queue '{_queueName}' is binded");

            
            // Listening

            var consumer = new AsyncEventingBasicConsumer(channel);

            consumer.Received += async (model, ea) =>
            {
                var body = ea.Body.ToArray();
                var json = Encoding.UTF8.GetString(body);
                var routingKey = ea.RoutingKey;

                try
                {
                    _logger.LogInformation($"Event accepted: {routingKey}");

                    switch (routingKey)
                    {
                        case "game.created":
                            await HandleGameCreatedAsync(json);
                            break;
                        case "game.started":
                            await HandleGameStartedAsync(json);
                            break;
                        case "game.guess_executed":
                            await HandleGuessExecutedAsync(json);
                            break;
                        case "game.player_joined":
                            await HandlePlayerJoinedAsync(json);
                            break;
                        case "game.player_team_changed":
                            await HandlePlayerTeamChangedAsync(json);
                            break;
                        case "game.hint_given":
                            await HandleHintGivenAsync(json);
                            break;
                        case "game.ended":
                            await HandleGameEndedAsync(json);
                            break;
                    }

                    // Confirms it
                    channel.BasicAck(ea.DeliveryTag, false);
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error while processing: {ex.Message}");
                    channel.BasicNack(ea.DeliveryTag, false, true);
                }
            };

            channel.BasicConsume(queue: _queueName, autoAck: false, consumer: consumer);

            await Task.Delay(Timeout.Infinite, stoppingToken);
        }
    
        /// <summary>
        /// Handlers are used to tell what happens when certain event comes in
        /// </summary>
        /// 
        private async Task HandleGameCreatedAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<GameCreatedEvent>(json);

            if (@event is null)
            {
                _logger.LogWarning("Received null GuessExecutedEvent");
                return;
            }

            _logger.LogInformation($"GameSession {@event.GameCode} created");

            // Signalizir sve klijente
            await _hubContext.Clients
                .All
                .GameCreated(new
                {
                    GameId = @event.GameCode,
                    GameName = @event.GameName
                });
        }

        private async Task HandleGameStartedAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<GameStartedEvent>(json);

            if (@event is null)
            {
                _logger.LogWarning("Received null GuessExecutedEvent");
                return;
            }

            _logger.LogInformation($"Game {@event.GameCode} started");

            // Signalizira samo odredjenoj grupi
            await _hubContext.Clients
                .Group($"game_{@event.GameCode}")
                .GameStarted(new
                {
                    FirstTeam = @event.FirstTeam.ToString()
                });
        }

        private async Task HandlePlayerJoinedAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<PlayerJoinedEvent>(json);

            if (@event is null) return;

            await _hubContext.Clients
                .Group($"game_{@event.GameCode}")
                .PlayerJoined(new
                {
                    UserId = @event.UserId,
                    TotalPlayers = @event.TotalPlayers
                });
        }

        private async Task HandlePlayerTeamChangedAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<PlayerTeamChangedEvent>(json);

            if (@event is null)
            {
                _logger.LogWarning("Received null PlayerTeamChangedEvent");
                return;
            }

            _logger.LogInformation($"Player {@event.PlayerName} changed team at game: {@event.GameCode}");

            await _hubContext.Clients
                .Group($"game_{@event.GameCode}")
                .PlayerTeamChanged(new
                {
                    PlayerName = @event.PlayerName,
                    NewTeam = @event.NewTeam,
                    IsMindreader = @event.IsMindreader
                });
        }

        private async Task HandleGuessExecutedAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<GuessExecutedEvent>(json);

            if (@event is null)
            {
                _logger.LogWarning("Received null GuessExecutedEvent");
                return;
            }

            _logger.LogInformation($"Guess at game: {@event.GameCode}");

            await _hubContext.Clients
                .Group($"game_{@event.GameCode}")
                .GuessExecuted(new
                {
                    RevealedCards = @event.RevealedCards,
                    IsGameOver = @event.IsGameOver,
                    Winner = @event.WinnerTeam?.ToString(),
                    CurrentTeam = @event.CurrentTeam.ToString()
                });
        }

        private async Task HandleHintGivenAsync(string json)
        {
            _logger.LogInformation($"Raw json: {json}"); 

            var @event = JsonSerializer.Deserialize<HintGivenEvent>(json);

            if (@event is null)
            {
                _logger.LogWarning("Received null GuessExecutedEvent");
                return;
            }

            _logger.LogInformation($"GameCode: {@event.GameCode}");
            _logger.LogInformation($"Word: {@event.Word}");

            _logger.LogInformation($"Hint at game: {@event.GameCode}");

            await _hubContext.Clients
                .Group($"game_{@event.GameCode}")
                .HintGiven(new
                {
                    Word = @event.Word,
                    WordCount = @event.WordCount
                });
        }

        private async Task HandleGameEndedAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<GameEndedEvent>(json);

            if (@event is null)
            {
                _logger.LogWarning("Received null GuessExecutedEvent");
                return;
            }

            _logger.LogInformation($"Game {@event.GameCode} has ended");

            await _hubContext.Clients
                .Group($"game_{@event.GameCode}")
                .GameEnded(new
                {
                    Winner = @event.Winner?.ToString()
                });
        }
    }
}