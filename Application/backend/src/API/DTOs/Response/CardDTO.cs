namespace API.DTOs.Response
{
    public class CardDTO
    {
        public required string Word { get; set; }
        public string? TeamColor { get; set; }  // "Red", "Blue", "Neutral", "Bomb"
        public bool IsRevealed { get; set; }
        public int Position { get; set; }
    }
}