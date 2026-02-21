using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IGuessRepository : IRepository<GuessEntity>
    {
        Task<IEnumerable<GuessEntity>> GetGameGuessesAsync(int gameSessionId);

        Task<IEnumerable<GuessEntity>> GetPlayerGuessesInGameAsync(int gameSessionId, int playerId);

        Task<int> CountGameGuessesAsync(int gameSessionId);

        Task<IEnumerable<GuessEntity>> GetTeamGuessesAsync(int gameSessionId, int teamId);

        Task<GuessEntity?> GetGuessWithDetailsAsync(int guessId);
    }
}