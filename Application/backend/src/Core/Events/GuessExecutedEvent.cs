using Core.Enums;
using Core.Models;

namespace Core.Events
{
    public class GuessExecutedEvent : GameEvent
    {
        public string? GameCode { get; set; }
        public int UserId { get; set; }
        public List<Card> RevealedCards { get; set; } = [];
        public bool IsGameOver { get; set; }
        public TeamColor? WinnerTeam { get; set; }
        // public override string ToString() 
        //     => $"Guess: '{CardWord}' - ";
    }
}