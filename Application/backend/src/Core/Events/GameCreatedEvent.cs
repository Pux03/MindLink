namespace Core.Events
{   
    public class GameCreatedEvent : GameEvent 
    {
        public string? GameName { get; set; }
        public int RedTeamId { get; set; }
        public int BlueTeamId { get; set; }

        public override string ToString() 
            => $"Game '{GameName}' created (ID: {GameSessionId})";
    }
}