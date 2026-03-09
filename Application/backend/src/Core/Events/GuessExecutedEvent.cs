using Core.Enums;
using Core.Models;

namespace Core.Events
{
    public class GuessExecutedEvent : GameEvent
    {
        public string? GameCode { get; set; }
        public int UserId { get; set; }
        public string PlayerUsername { get; set; } = string.Empty;
        public List<Card> RevealedCards { get; set; } = [];
        public int RedTeamRemainingCardsCount { get; set; }
        public int BlueTeamRemainingCardsCount { get; set; }
        public bool IsGameOver { get; set; }
        public TeamColor? WinnerTeam { get; set; }
        public TeamColor CurrentTeam { get; set; }
        
        // public override string ToString() 
        //     => $"Guess: '{CardWord}' - ";
    }
}