using Core.Enums;

namespace Core.Events
{
    public class GuessExecutedEvent : GameEvent
    {
        public int PlayerId { get; set; }
        public int CardPosition { get; set; }
        public string CardWord { get; set; }
        public TeamColor CardTeam { get; set; }
        public bool IsCorrect { get; set; }
        public int Index { get; set; }

        // public override string ToString() 
        //     => $"Guess: '{CardWord}' - ";
    }
}