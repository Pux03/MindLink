using Core.Events;

namespace API.MessageQueue
{
    /// <summary>
    /// It serves purpose to tell what the publisher should do when event gets to it
    /// </summary>
    public interface IGameEventPublisher
    {
        Task PublishGameCreatedAsync(GameCreatedEvent @event);
        Task PublishGameStartedAsync(GameStartedEvent @event);
        Task PublishGuessExecutedAsync(GuessExecutedEvent @event);
        Task PublishHintGivenAsync(HintGivenEvent @event);
        Task PublishGameEndedAsync(GameEndedEvent @event);
    }
}