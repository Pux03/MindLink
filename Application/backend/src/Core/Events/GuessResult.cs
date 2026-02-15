using Core.Models;

namespace Core.Events
{
    public class GuessResult
    {
        public bool IsValid { get; set; }
        public Card Card { get; set; }
        public bool IsCorrect { get; set; }
        // public string Message { get; set; }
    }
}