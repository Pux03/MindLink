using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IGameSessionRepository : IRepository<GameSessionEntity>
    {
        /// <summary>
        /// Pronađi GameSession sa Board-om (sve kartice iz JSON-a), timovima i igračima
        /// </summary>
        Task<GameSessionEntity?> GetGameWithBoardAndTeamsAsync(int gameId);

        /// <summary>
        /// Pronađi GameSession sa svim Guess-evima i igračima koji su pogađali
        /// </summary>
        Task<GameSessionEntity?> GetGameWithGuessesAsync(int gameId);

        /// <summary>
        /// Pronađi GameSession sa svim Hint-ovima
        /// </summary>
        Task<GameSessionEntity?> GetGameWithHintsAsync(int gameId);

        /// <summary>
        /// Pronađi sve aktivne partije (Status = Active)
        /// </summary>
        Task<IEnumerable<GameSessionEntity>> GetActiveGamesAsync();

        /// <summary>
        /// Pronađi sve završene partije (Status = GameOver)
        /// </summary>
        Task<IEnumerable<GameSessionEntity>> GetFinishedGamesAsync();

        /// <summary>
        /// Pronađi sve partije određenog tima
        /// </summary>
        Task<IEnumerable<GameSessionEntity>> GetGamesByTeamAsync(int teamId);

        /// <summary>
        /// Kompletan pregled partije sa svim podacima (Board, Timovi, Guess, Hint)
        /// </summary>
        Task<GameSessionEntity?> GetFullGameDetailsAsync(int gameId);
    }
}