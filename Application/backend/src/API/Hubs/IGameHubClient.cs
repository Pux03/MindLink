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
        
        // FOr errors
        Task Error(string message);
    }
}