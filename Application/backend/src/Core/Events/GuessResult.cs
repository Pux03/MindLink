using Core.Enums;
using Core.Models;

namespace Core.Events
{
    public class GuessResult : GameEvent
    {
        public bool IsGameOver { get; set; }
        public TeamColor? WinnerTeam { get; set; }
    }
}