using Core.Enums;

namespace Core.Models
{

    public class GameSession
    {
        public string Code { get; set; } = string.Empty;
        public Board Board { get; set; } = new Board();
        public Team RedTeam { get; set; } = new Team();
        public Team BlueTeam { get; set; } = new Team();
        public TeamColor CurrentTeam { get; set; } = TeamColor.Blue;
        public GameStatus Status { get; set; } = GameStatus.Waiting;
        public TeamColor? Winner { get; set; } = null;
        public List<Guess> GuessHistory { get; set; } = [];
        public List<Hint> HintHistory { get; set; } = [];
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }

        // For Lobby 
        public List<Player> Players { get; set; } = [];
        public int MaxPlayers { get; set; } = 4;

        // Who created the GameSession
        public int CreatedByUserId { get; set; }

        public TeamColor GetTeamByPlayer()
        {
            return TeamColor.Neutral;
        }

        // TODO
        public void AddGuess(Guess guess)
        {
            GuessHistory.Add(guess);
        }
    }

}