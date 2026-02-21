namespace Core.Models
{
    public class Guess
    {
        public int Id { get; set; }
        public int Index { get; set; }
        public int PlayerId { get; set; }
        public Player? Player { get; set; }
        public int CardPosition { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}