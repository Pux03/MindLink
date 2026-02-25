using Core.Enums;
using Core.Events;
using Core.Models;

namespace API.Services
{
    public interface IGameLogicService
    {
        bool IsGameOver(GameSession game);
        bool CanPlayerGuess(GameSession game, Player player);
        Task<GuessExecutedEvent> ExecuteGuessAsync(GameSession game, int userId, List<int> cardPositions);
        Task<HintGivenEvent> GiveHintAsync(GameSession game, Player mindReader, string word, int wordCount);
    }
}