using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IHintRepository : IRepository<HintEntity>
    {
        Task<IEnumerable<HintEntity>> GetGameHintsAsync(int gameSessionId);

        Task<IEnumerable<HintEntity>> GetPlayerHintsAsync(int playerId);

        Task<IEnumerable<HintEntity>> GetMindreaderHintsInGameAsync(int gameSessionId, int playerId);

        Task<HintEntity?> GetHintWithDetailsAsync(int hintId);

        Task<int> CountGameHintsAsync(int gameSessionId);
    }
}