using System.ComponentModel.DataAnnotations.Schema;

namespace Persistence.Entities
{
    [Table("hints")]
    public class HintEntity : BaseEntity
    {
        public string Word { get; set; } = string.Empty;
        public int WordCount { get; set; }

        // FK Player
        public int PlayerId { get; set; }
        public PlayerEntity? Player { get; set; }

        // FK GameSession
        public int GameSessionId { get; set; }
        public GameSessionEntity? GameSession { get; set; }
    }
}
