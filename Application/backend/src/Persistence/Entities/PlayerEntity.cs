using Core.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Persistence.Entities
{
    [Table("players")]
    public class PlayerEntity : BaseEntity
    {
        public int UserId { get; set; }
        public UserEntity? User { get; set; }
        public bool IsMindreader { get; set; } = false;
        public bool IsPlaying { get; set; } = false;
        public int? TeamId { get; set; }
        public TeamEntity? Team { get; set; }
        public ICollection<GuessEntity> Guesses { get; set; } = [];
        public ICollection<HintEntity> Hints { get; set; } = [];
    }
}