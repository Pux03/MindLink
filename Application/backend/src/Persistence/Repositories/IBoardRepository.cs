using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IBoardRepository : IRepository<BoardEntity>
    {
        Task<BoardEntity?> GetBoardWithCardsAsync(int boardId);

        Task<BoardEntity?> GetBoardByGameSessionAsync(int gameSessionId);

        Task UpdateBoardCardsAsync(int boardId, List<CardEntity> cards);
    }
}