using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using Persistence.Entities;

namespace Persistence.Repositories
{
    public class PlayerRepository : RepositoryBase<PlayerEntity>, IPlayerRepository
    {
        public PlayerRepository(MindLinkDbContext context) : base(context) { }

        public async Task<PlayerEntity?> GetByUsernameAsync(string username)
        {
            return await _dbSet
                .Include(p => p.Team)
                .FirstOrDefaultAsync(p => p.Username.ToLower() == username.ToLower());
        }

        public async Task<PlayerEntity?> GetPlayerWithTeamAsync(int playerId)
        {
            return await _dbSet
                .Include(p => p.Team)
                .FirstOrDefaultAsync(p => p.Id == playerId);
        }

        public async Task<IEnumerable<PlayerEntity>> GetPlayersByTeamAsync(int teamId)
        {
            return await _dbSet
                .Where(p => p.TeamId == teamId)
                .Include(p => p.Team)
                .ToListAsync();
        }

        public async Task<PlayerEntity?> GetMindreaderByTeamAsync(int teamId)
        {
            return await _dbSet
                .Where(p => p.TeamId == teamId && p.IsMindreader)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<PlayerEntity>> GetActivePlayers()
        {
            return await _dbSet
                .Where(p => p.IsPlaying)
                .Include(p => p.Team)
                .ToListAsync();
        }

        public async Task<IEnumerable<GuessEntity>> GetPlayerGuessesAsync(int playerId)
        {
            return await _context.Guesses
                .Where(g => g.PlayerId == playerId)
                .Include(g => g.GameSession)
                .OrderByDescending(g => g.ExecutedAt)
                .ToListAsync();
        }
    }
}