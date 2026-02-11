using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using Persistence.Entities;

namespace Persistence.Repositories
{
    public class BoardRepository : RepositoryBase<BoardEntity>, IBoardRepository
    {
        public BoardRepository(MindLinkDbContext context) : base(context) { }

        public async Task<BoardEntity?> GetBoardWithCardsAsync(int boardId)
        {
            // Board već ima Cards kao JSONB, samo učitaj ga
            return await _dbSet
                .FirstOrDefaultAsync(b => b.Id == boardId);
        }

        public async Task<BoardEntity?> GetBoardByGameSessionAsync(int gameSessionId)
        {
            return await _dbSet
                .FirstOrDefaultAsync(b => b.GameSessionId == gameSessionId);
        }

        public async Task UpdateBoardCardsAsync(int boardId, List<CardEntity> cards)
        {
            var board = await GetByIdAsync(boardId);
            if (board != null)
            {
                board.Cards = cards;
                board.UpdatedAt = DateTime.UtcNow;
                await UpdateAsync(board);
                await SaveChangesAsync();
            }
        }
    }
}