using System.ComponentModel.DataAnnotations.Schema;

namespace Persistence.Entities
{
    [Table("boards")]
    public class BoardEntity : BaseEntity
    {
        public int GameSessionId { get; set; }
        // public GameSessionEntity? GameSession { get; set; }
        public int Size { get; set; } = 25;
        // public ICollection<CardEntity> Cards { get; set; } = [];
    
        [Column(TypeName = "jsonb")]
        public List<CardEntity> Cards { get; set; } = [];
    }
}
