namespace API.DTOs.Response
{
    public class PlayerStatsDto
    {
        public int GamesPlayed { get; set; }
        public int Wins { get; set; }
        public int Losses { get; set; }
        public int WinRate { get; set; }
        public int AsSpymaster { get; set; }
        public int AsOperative { get; set; }
        public int CorrectGuesses { get; set; }
        public int WrongGuesses { get; set; }
        public int HintsGiven { get; set; }
    }
}