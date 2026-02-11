using System.ComponentModel.DataAnnotations.Schema;

namespace Persistence.Entities
{
    [Table("guesses")]
    public class GuessEntity : BaseEntity
    {
        public int Index { get; set; }
        
        // FK Player
        public int PlayerId { get; set; }
        public PlayerEntity? Player { get; set; }

        public int CardPosition { get; set; }

        // Ako se cuvaju u json-u onda nema potrebe, cuva se samo pozicija kartice u json nizu
        // public int CardId { get; set; }
        // public CardEntity? Card { get; set; }

        // FK GameSession
        public int GameSessionId { get; set; }
        public GameSessionEntity? GameSession { get; set; }

        public DateTime ExecutedAt { get; set; } = DateTime.UtcNow;
    }
}