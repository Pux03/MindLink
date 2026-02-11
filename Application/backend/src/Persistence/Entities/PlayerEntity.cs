using Core.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace Persistence.Entities
{
    [Table("players")]
    public class PlayerEntity : BaseEntity
    {
        public string Username { get; set; } = string.Empty;
        public bool IsMindreader { get; set; } = false;
        public bool IsPlaying { get; set; } = false;

        // Navigacija
        public int? TeamId { get; set; }
        public TeamEntity? Team { get; set; }

        public ICollection<GuessEntity> Guesses { get; set; } = [];
        public ICollection<HintEntity> Hints { get; set; } = [];
    }

}