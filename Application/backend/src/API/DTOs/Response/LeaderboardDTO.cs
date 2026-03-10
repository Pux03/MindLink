namespace API.DTOs.Response
{
    public class LeaderboardDto
    {
        public List<LeaderboardEntryDto> MostWins { get; set; } = [];
        public List<LeaderboardEntryDto> MostCorrectGuesses { get; set; } = [];
    }
}