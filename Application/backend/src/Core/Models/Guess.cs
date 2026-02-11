namespace Core.Models
{

    public class Guess
    {
        public int Id { get; set; }
        public int Index { get; set; }
        public Player? Player { get; set; }
        public Card? Card { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }

}