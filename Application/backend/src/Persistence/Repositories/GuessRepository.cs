using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using Persistence.Entities;

namespace Persistence.Repositories
{
    public class GuessRepository : RepositoryBase<GuessEntity>, IGuessRepository
    {
        public GuessRepository(MindLinkDbContext context) : base(context) { }

        public async Task<IEnumerable<GuessEntity>> GetGameGuessesAsync(int gameSessionId)
        {
            return await _dbSet
                .Where(g => g.GameSessionId == gameSessionId)
                .Include(g => g.Player)
                .OrderBy(g => g.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<GuessEntity>> GetPlayerGuessesInGameAsync(int gameSessionId, int playerId)
        {
            return await _dbSet
                .Where(g => g.GameSessionId == gameSessionId && g.PlayerId == playerId)
                .Include(g => g.Player)
                .OrderBy(g => g.ExecutedAt)
                .ToListAsync();
        }

        public async Task<int> CountGameGuessesAsync(int gameSessionId)
        {
            return await _dbSet
                .Where(g => g.GameSessionId == gameSessionId)
                .CountAsync();
        }

        public async Task<IEnumerable<GuessEntity>> GetTeamGuessesAsync(int gameSessionId, int teamId)
        {
            return await _dbSet
                .Where(g => g.GameSessionId == gameSessionId && g.Player!.TeamId == teamId)
                .Include(g => g.Player)
                .OrderBy(g => g.ExecutedAt)
                .ToListAsync();
        }

        public async Task<GuessEntity?> GetGuessWithDetailsAsync(int guessId)
        {
            return await _dbSet
                .Include(g => g.Player)
                    .ThenInclude(p => p.Team)
                .Include(g => g.GameSession)
                .FirstOrDefaultAsync(g => g.Id == guessId);
        }
    }
}