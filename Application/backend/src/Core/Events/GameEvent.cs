namespace Core.Events
{
    public abstract class GameEvent
    {
        public string EventId { get; set; } = Guid.NewGuid().ToString();
        public string CorrelationId { get; set; } = Guid.NewGuid().ToString();
        public string GameCode { get; set; } = string.Empty;
        public DateTime TimeStamp { get; set; } = DateTime.UtcNow;
        public int Version { get; set; } = 1;   
    }
}