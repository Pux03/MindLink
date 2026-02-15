using Core.Enums;

namespace Core.Events
{
    public class GameStartedEvent : GameEvent
    {
        public TeamColor FirstTeam { get; set; }

        public override string ToString() 
            => $"Game Started. Plays first: {FirstTeam}";
    }
}