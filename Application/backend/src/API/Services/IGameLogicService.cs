using Core.Enums;
using Core.Models;

namespace API.Services
{
    public interface IGameLogicService
    {
        bool isGameOver(GameSession game);

        TeamColor? DetermineWinner(GameSession game);

        bool CanPlayerGuess(GameSession game, Player player);
    }
}