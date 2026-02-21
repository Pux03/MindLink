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

            _logger.LogInformation($"GameSession {@event.GameSessionId} created");

            // Signalizir sve klijente
            await _hubContext.Clients
                .All
                .GameCreated(new
                {
                    GameId = @event.GameSessionId,
                    GameName = @event.GameName
                });
        }

        private async Task HandleGameStartedAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<GameStartedEvent>(json);

            _logger.LogInformation($"Game {@event.GameSessionId} started");

            // Signalizira samo odredjenoj grupi
            await _hubContext.Clients
                .Group($"game_{@event.GameSessionId}")
                .GameStarted(new
                {
                    FirstTeam = @event.FirstTeam.ToString()
                });
        }

        private async Task HandleGuessExecutedAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<GuessExecutedEvent>(json);

            _logger.LogInformation($"Guess at game: {@event.GameSessionId}");

            // samo grupi
            await _hubContext.Clients
                .Group($"game_{@event.GameSessionId}")
                .GuessExecuted(new
                {
                    //CardWord = @event.CardWord,
                    //CardTeam = @event.CardTeam.ToString(),
                    //IsCorrect = @event.IsCorrect,
                    //Index = @event.Index
                });
        }

        private async Task HandleHintGivenAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<HintGivenEvent>(json);

            _logger.LogInformation($"Hint at game: {@event.GameSessionId}");

            // Signalizira grupi
            await _hubContext.Clients
                .Group($"game_{@event.GameSessionId}")
                .HintGiven(new
                {
                    Word = @event.Word,
                    WordCount = @event.WordCount
                });
        }

        private async Task HandleGameEndedAsync(string json)
        {
            var @event = JsonSerializer.Deserialize<GameEndedEvent>(json);

            _logger.LogInformation($"Game {@event.GameSessionId} has ended");

            // Signalizira grupi
            await _hubContext.Clients
                .Group($"game_{@event.GameSessionId}")
                .GameEnded(new
                {
                    Winner = @event.Winner?.ToString()
                });
        }
    }
}