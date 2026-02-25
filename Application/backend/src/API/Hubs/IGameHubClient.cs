namespace API.Hubs
{
    public interface IGameHubClient
    {
        // Events
        Task GameCreated(object data);
        Task GameStarted(object data);
        Task GuessExecuted(object data);
        Task HintGiven(object data);
        Task GameEnded(object data);
        Task PlayerJoined(object data);
        Task PlayerTeamChanged(object data);
        Task GuessResult(object data);
        Task ReceiveCards(object data);
        // FOr errors
        Task Error(string message);
    }
}