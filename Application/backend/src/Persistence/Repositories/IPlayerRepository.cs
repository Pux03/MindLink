using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IPlayerRepository : IRepository<PlayerEntity>
    {
        Task<PlayerEntity?> GetByUsernameAsync(string username);

        Task<PlayerEntity?> GetPlayerWithTeamAsync(int playerId);

        Task<IEnumerable<PlayerEntity>> GetPlayersByTeamAsync(int teamId);

        Task<PlayerEntity?> GetMindreaderByTeamAsync(int teamId);

        Task<IEnumerable<PlayerEntity>> GetActivePlayers();

        Task<IEnumerable<GuessEntity>> GetPlayerGuessesAsync(int playerId);
    }
}