using Core.Enums;

namespace Core.Events
{
    public class GuessExecutedEvent : GameEvent
    {
        public int UserId { get; set; }
        public List<int> GuessedCardPositions { get; set; } = [];
        public bool IsGameOver { get; set; }
        public TeamColor? WinnerTeam { get; set; }
        // public override string ToString() 
        //     => $"Guess: '{CardWord}' - ";
    }
}