using System.ComponentModel.DataAnnotations.Schema;
using Core.Enums;

namespace Persistence.Entities
{
    [Table("game_sessions")]
    public class GameSessionEntity : BaseEntity
    {
        public string Name { get; set; } = string.Empty;

        // Board
        public BoardEntity? Board { get; set; }

        // Teams
        public int RedTeamId { get; set; }
        public TeamEntity? RedTeam { get; set; }

        public int BlueTeamId { get; set; }
        public TeamEntity? BlueTeam { get; set; }

        public TeamColor CurrentTeam { get; set; } = TeamColor.Blue;
        public GameStatus Status { get; set; } = GameStatus.Active;
        public TeamColor? Winner { get; set; }

        public ICollection<GuessEntity> GuessHistory { get; set; } = [];
        public ICollection<HintEntity> Hints { get; set; } = [];

        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }
    }
}