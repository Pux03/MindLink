using Core.Models;

namespace API.Services
{
    public interface IPlayerService
    {
        Task<Player> JoinGameAsync(int gameId, int playerId);
        Task<Player> LeaveGameAsync(int gameId, int playerId);
        Task<Player> SetMindreaderAsync(int playerId, bool isMindreader);
    }
}