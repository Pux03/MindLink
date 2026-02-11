using Core.Enums;
using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using Persistence.Entities;

namespace Persistence.Repositories
{
    public class GameSessionRepository : RepositoryBase<GameSessionEntity>, IGameSessionRepository
    {
        public GameSessionRepository(MindLinkDbContext context) : base(context) { }

        public async Task<GameSessionEntity?> GetGameWithBoardAndTeamsAsync(int gameId)
        {
            return await _dbSet
                .Include(g => g.Board)  // ← Učitaj Board sa JSONB Cards
                .Include(g => g.RedTeam)
                    .ThenInclude(t => t.Members)
                .Include(g => g.BlueTeam)
                    .ThenInclude(t => t.Members)
                .FirstOrDefaultAsync(g => g.Id == gameId);
        }

        public async Task<GameSessionEntity?> GetGameWithGuessesAsync(int gameId)
        {
            return await _dbSet
                .Include(g => g.GuessHistory)
                    .ThenInclude(gu => gu.Player)
                .FirstOrDefaultAsync(g => g.Id == gameId);
        }

        public async Task<GameSessionEntity?> GetGameWithHintsAsync(int gameId)
        {
            return await _dbSet
                .Include(g => g.Hints)
                    .ThenInclude(h => h.Player)
                .FirstOrDefaultAsync(g => g.Id == gameId);
        }

        public async Task<IEnumerable<GameSessionEntity>> GetActiveGamesAsync()
        {
            return await _dbSet
                .Where(g => g.Status == GameStatus.Active)
                .Include(g => g.RedTeam)
                .Include(g => g.BlueTeam)
                .ToListAsync();
        }

        public async Task<IEnumerable<GameSessionEntity>> GetFinishedGamesAsync()
        {
            return await _dbSet
                .Where(g => g.Status == GameStatus.GameOver)
                .Include(g => g.RedTeam)
                .Include(g => g.BlueTeam)
                .OrderByDescending(g => g.EndTime)
                .ToListAsync();
        }

        public async Task<IEnumerable<GameSessionEntity>> GetGamesByTeamAsync(int teamId)
        {
            return await _dbSet
                .Where(g => g.RedTeamId == teamId || g.BlueTeamId == teamId)
                .Include(g => g.RedTeam)
                .Include(g => g.BlueTeam)
                .ToListAsync();
        }

        public async Task<GameSessionEntity?> GetFullGameDetailsAsync(int gameId)
        {
            return await _dbSet
                .Include(g => g.Board)
                .Include(g => g.RedTeam)
                    .ThenInclude(t => t.Members)
                .Include(g => g.BlueTeam)
                    .ThenInclude(t => t.Members)
                .Include(g => g.GuessHistory)
                    .ThenInclude(gu => gu.Player)
                .Include(g => g.Hints)
                    .ThenInclude(h => h.Player)
                .FirstOrDefaultAsync(g => g.Id == gameId);
        }
    }
}