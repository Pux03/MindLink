using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IHintRepository : IRepository<HintEntity>
    {
        /// <summary>
        /// Pronađi sve Hint-ove određene partije
        /// </summary>
        Task<IEnumerable<HintEntity>> GetGameHintsAsync(int gameSessionId);

        /// <summary>
        /// Pronađi sve Hint-ove određenog Mind Reader-a
        /// </summary>
        Task<IEnumerable<HintEntity>> GetPlayerHintsAsync(int playerId);

        /// <summary>
        /// Pronađi sve Hint-ove Mind Reader-a u određenoj partiji
        /// </summary>
        Task<IEnumerable<HintEntity>> GetMindreaderHintsInGameAsync(int gameSessionId, int playerId);

        /// <summary>
        /// Pronađi Hint sa svim detaljima
        /// </summary>
        Task<HintEntity?> GetHintWithDetailsAsync(int hintId);

        /// <summary>
        /// Broji koliko Hint-ova je bilo u partiji
        /// </summary>
        Task<int> CountGameHintsAsync(int gameSessionId);
    }
}