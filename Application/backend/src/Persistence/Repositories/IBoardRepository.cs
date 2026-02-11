using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IBoardRepository : IRepository<BoardEntity>
    {
        /// <summary>
        /// Pronađi Board za određenu GameSession (uključujući sve kartice iz JSON-a)
        /// </summary>
        Task<BoardEntity?> GetBoardWithCardsAsync(int boardId);

        /// <summary>
        /// Pronađi Board po GameSessionId
        /// </summary>
        Task<BoardEntity?> GetBoardByGameSessionAsync(int gameSessionId);

        /// <summary>
        /// Update-uj Board (uključujući JSON kartice)
        /// </summary>
        Task UpdateBoardCardsAsync(int boardId, List<CardEntity> cards);
    }
}