using RabbitMQ.Client;
using Core.Events;
using System.Text.Json;
using System.Text;
using Microsoft.Extensions.Logging;

namespace API.MessageQueue
{
    /// <summary>
    /// Publisher - Publishes events to the RabbitMQ
    /// Services than use the event
    /// </summary>
    public class RabbitMqGameEventPublisher : IGameEventPublisher
    {
        private readonly IConnection _connection;
        private readonly string _exchangeName = "mindlink.games";
        private readonly ILogger<RabbitMqGameEventPublisher> _logger;

        public RabbitMqGameEventPublisher
        (
            IConnection connection,
            ILogger<RabbitMqGameEventPublisher> logger
        )
        {
            _connection = connection;
            _logger = logger;
            DeclareExchange();
        }

        /// <summary>
        /// Create Exchange if it doesnt exist
        /// </summary>
        private void DeclareExchange()
        {
            try
            {
                using var channel = _connection.CreateModel();
                channel.ExchangeDeclare(
                    exchange: _exchangeName,
                    type: ExchangeType.Topic,
                    durable: true
                );
                _logger.LogInformation($"Exchange '{_exchangeName}' is ready");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error when creating exchange: {ex.Message}");
            }
        }

        public async Task PublishGameCreatedAsync(GameCreatedEvent @event)
        {
            await PublishEventAsync("game.created", @event);
        }

        public async Task PublishGameStartedAsync(GameStartedEvent @event)
        {
            await PublishEventAsync("game.started", @event);
        }

        public async Task PublishGuessExecutedAsync(GuessExecutedEvent @event)
        {
            await PublishEventAsync("game.guess_executed", @event);
        }

        public async Task PublishHintGivenAsync(HintGivenEvent @event)
        {
            await PublishEventAsync("game.hint_given", @event);
        }

        public async Task PublishGameEndedAsync(GameEndedEvent @event)
        {
            await PublishEventAsync("game.ended", @event);
        }

        /// <summary>
        /// Base method that publishes vevents
        /// </summary>
        private async Task PublishEventAsync(string routingKey, GameEvent @event)
        {
            try
            {
                using var channel = _connection.CreateModel();

                // Serializes them to JSON
                var json = JsonSerializer.Serialize(@event);
                var body = Encoding.UTF8.GetBytes(json);

                // Makes properties
                var properties = channel.CreateBasicProperties();
                properties.Persistent = true;  // Saves if it dips
                properties.ContentType = "application/json";

                // Publish
                channel.BasicPublish(
                    exchange: _exchangeName,
                    routingKey: routingKey,
                    basicProperties: properties,
                    body: body
                );

                _logger.LogInformation($"Event published: {routingKey}");
                await Task.CompletedTask;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error when publishing: {ex.Message}");
                throw;
            }
        }
    }
}