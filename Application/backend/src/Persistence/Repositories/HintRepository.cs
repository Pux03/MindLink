using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using Persistence.Entities;

namespace Persistence.Repositories
{
    public class HintRepository : RepositoryBase<HintEntity>, IHintRepository
    {
        public HintRepository(MindLinkDbContext context) : base(context) { }

        public async Task<IEnumerable<HintEntity>> GetGameHintsAsync(int gameSessionId)
        {
            return await _dbSet
                .Where(h => h.GameSessionId == gameSessionId)
                .Include(h => h.Player)
                .OrderBy(h => h.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<HintEntity>> GetPlayerHintsAsync(int playerId)
        {
            return await _dbSet
                .Where(h => h.PlayerId == playerId)
                .Include(h => h.GameSession)
                .OrderByDescending(h => h.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<HintEntity>> GetMindreaderHintsInGameAsync(int gameSessionId, int playerId)
        {
            return await _dbSet
                .Where(h => h.GameSessionId == gameSessionId && h.PlayerId == playerId)
                .OrderBy(h => h.CreatedAt)
                .ToListAsync();
        }

        public async Task<HintEntity?> GetHintWithDetailsAsync(int hintId)
        {
            return await _dbSet
                .Include(h => h.Player)
                    .ThenInclude(p => p.Team)
                .Include(h => h.GameSession)
                .FirstOrDefaultAsync(h => h.Id == hintId);
        }

        public async Task<int> CountGameHintsAsync(int gameSessionId)
        {
            return await _dbSet
                .Where(h => h.GameSessionId == gameSessionId)
                .CountAsync();
        }
    }
}