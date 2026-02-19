using Core.Enums;
using Core.Events;
using Core.Models;

namespace API.Services
{
    public interface IGameLogicService
    {
        bool isGameOver(GameSession game);
        TeamColor? DetermineWinner(GameSession game);
        bool CanPlayerGuess(GameSession game, Player player);
        Task<GuessExecutedEvent> ExecuteGuessAsync(GameSession game, Player player, int cardPosition);
        Task<HintGivenEvent> GiveHintAsync(GameSession game, Player mindReader, string word, int wordCount);
        
    }
}