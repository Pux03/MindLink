namespace API.DTOs.Response
{
    public class GuessDTO
    {
        public int Id { get; set; }
        public int Index { get; set; }
        public PlayerDTO Player { get; set; }
        public CardDTO Card { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
