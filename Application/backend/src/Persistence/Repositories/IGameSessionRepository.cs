using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IGameSessionRepository : IRepository<GameSessionEntity>
    {
        Task<GameSessionEntity?> GetGameWithBoardAndTeamsAsync(int gameId);

        Task<GameSessionEntity?> GetGameWithGuessesAsync(int gameId);

        Task<GameSessionEntity?> GetGameWithHintsAsync(int gameId);

        Task<IEnumerable<GameSessionEntity>> GetActiveGamesAsync();

        Task<IEnumerable<GameSessionEntity>> GetFinishedGamesAsync();

        Task<IEnumerable<GameSessionEntity>> GetGamesByTeamAsync(int teamId);

        Task<GameSessionEntity?> GetFullGameDetailsAsync(int gameId);
    }
}