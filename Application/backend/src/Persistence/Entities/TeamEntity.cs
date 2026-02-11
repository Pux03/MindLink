using System.ComponentModel.DataAnnotations.Schema;
using Core.Enums;

namespace Persistence.Entities
{
    [Table("teams")]
    public class TeamEntity : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public TeamColor Color { get; set; }
        public int Score { get; set; } = 0;
        public ICollection<PlayerEntity> Members { get; set; } = [];
    }
}
