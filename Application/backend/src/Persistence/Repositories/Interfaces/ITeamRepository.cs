using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface ITeamRepository : IRepository<TeamEntity>
    {
        Task<TeamEntity?> GetTeamWithMembersAsync(int teamId);
        Task<IEnumerable<TeamEntity>> GetAllTeamsWithMembersAsync();
        Task<TeamEntity?> GetTeamByColorAsync(string colorName);
        Task<PlayerEntity?> GetTeamMindreaderAsync(int teamId);
        Task<int> CountTeamMembersAsync(int teamId);

        Task AddMemberToTeamAsync(int teamId, PlayerEntity player);
    }
}