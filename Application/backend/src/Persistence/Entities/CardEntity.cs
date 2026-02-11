using Core.Enums;

namespace Persistence.Entities
{
    public class CardEntity
    {
        public string Word { get; set; } = string.Empty;
        public TeamColor? TeamColor { get; set; }
        public bool IsRevealed { get; set; } = false;
        public int Position { get; set; }

        // Ovo ne bi trebalo da postoji ako ga cuvamo kao json
        // public int BoardId { get; set; }
        // public BoardEntity? Board { get; set; }
    }
}