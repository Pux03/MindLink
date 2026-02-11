using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface ITeamRepository : IRepository<TeamEntity>
    {
        /// <summary>
        /// Pronađi Tim sa svim članovima
        /// </summary>
        Task<TeamEntity?> GetTeamWithMembersAsync(int teamId);

        /// <summary>
        /// Pronađi sve timove
        /// </summary>
        Task<IEnumerable<TeamEntity>> GetAllTeamsWithMembersAsync();

        /// <summary>
        /// Pronađi Tim po boji
        /// </summary>
        Task<TeamEntity?> GetTeamByColorAsync(string colorName);

        /// <summary>
        /// Pronađi Mind Reader-a tima
        /// </summary>
        Task<PlayerEntity?> GetTeamMindreaderAsync(int teamId);

        /// <summary>
        /// Broji članove tima
        /// </summary>
        Task<int> CountTeamMembersAsync(int teamId);

        /// <summary>
        /// Dodaj igrača u tim
        /// </summary>
        Task AddMemberToTeamAsync(int teamId, PlayerEntity player);
    }
}