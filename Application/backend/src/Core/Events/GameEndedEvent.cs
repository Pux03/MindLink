using Core.Enums;

namespace Core.Events
{
    public class GameEndedEvent : GameEvent
    {
        public TeamColor? Winner { get; set; }
        public DateTime EndTime { get; set; }
        public string Reason { get; set; }

        // public override string ToString() 
        //     => "";
    }
}