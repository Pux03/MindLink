using Core.Enums;

namespace Core.Events
{
    public class PlayerJoinedEvent : GameEvent
    {
        public int UserId { get; set; }
        public int TotalPlayers { get; set; }
    }
}