using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IGuessRepository : IRepository<GuessEntity>
    {
        /// <summary>
        /// Pronađi sve Guess-eve određene partije
        /// </summary>
        Task<IEnumerable<GuessEntity>> GetGameGuessesAsync(int gameSessionId);

        /// <summary>
        /// Pronađi sve Guess-eve određenog igrača u partiji
        /// </summary>
        Task<IEnumerable<GuessEntity>> GetPlayerGuessesInGameAsync(int gameSessionId, int playerId);

        /// <summary>
        /// Broji koliko Guess-eva je bilo u partiji
        /// </summary>
        Task<int> CountGameGuessesAsync(int gameSessionId);

        /// <summary>
        /// Pronađi sve Guess-eve određenog tima u partiji
        /// </summary>
        Task<IEnumerable<GuessEntity>> GetTeamGuessesAsync(int gameSessionId, int teamId);

        /// <summary>
        /// Pronađi Guess sa svim detaljima (Player, GameSession)
        /// </summary>
        Task<GuessEntity?> GetGuessWithDetailsAsync(int guessId);
    }
}