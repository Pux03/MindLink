using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IPlayerRepository : IRepository<PlayerEntity>
    {
        /// <summary>
        /// Pronađi igrača po korisničkom imenu
        /// </summary>
        Task<PlayerEntity?> GetByUsernameAsync(string username);

        /// <summary>
        /// Pronađi igrača sa njegovim timom
        /// </summary>
        Task<PlayerEntity?> GetPlayerWithTeamAsync(int playerId);

        /// <summary>
        /// Pronađi sve igrače određenog tima
        /// </summary>
        Task<IEnumerable<PlayerEntity>> GetPlayersByTeamAsync(int teamId);

        /// <summary>
        /// Pronađi Mind Reader-a određenog tima
        /// </summary>
        Task<PlayerEntity?> GetMindreaderByTeamAsync(int teamId);

        /// <summary>
        /// Pronađi sve igrače koji su trenutno u igri
        /// </summary>
        Task<IEnumerable<PlayerEntity>> GetActivePlayers();

        /// <summary>
        /// Pronađi sve Guess-eve određenog igrača
        /// </summary>
        Task<IEnumerable<GuessEntity>> GetPlayerGuessesAsync(int playerId);
    }
}