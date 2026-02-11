using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using Persistence.Entities;

namespace Persistence.Repositories
{
    public class TeamRepository : RepositoryBase<TeamEntity>, ITeamRepository
    {
        public TeamRepository(MindLinkDbContext context) : base(context) { }

        public async Task<TeamEntity?> GetTeamWithMembersAsync(int teamId)
        {
            return await _dbSet
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.Id == teamId);
        }

        public async Task<IEnumerable<TeamEntity>> GetAllTeamsWithMembersAsync()
        {
            return await _dbSet
                .Include(t => t.Members)
                .ToListAsync();
        }

        public async Task<TeamEntity?> GetTeamByColorAsync(string colorName)
        {
            // colorName je "Blue" ili "Red"
            return await _dbSet
                .Include(t => t.Members)
                .FirstOrDefaultAsync(t => t.Color.ToString() == colorName);
        }

        public async Task<PlayerEntity?> GetTeamMindreaderAsync(int teamId)
        {
            return await _context.Players
                .FirstOrDefaultAsync(p => p.TeamId == teamId && p.IsMindreader);
        }

        public async Task<int> CountTeamMembersAsync(int teamId)
        {
            return await _context.Players
                .CountAsync(p => p.TeamId == teamId);
        }

        public async Task AddMemberToTeamAsync(int teamId, PlayerEntity player)
        {
            var team = await GetTeamWithMembersAsync(teamId);
            if (team != null)
            {
                player.TeamId = teamId;
                team.Members.Add(player);
                await UpdateAsync(team);
                await SaveChangesAsync();
            }
        }
    }
}