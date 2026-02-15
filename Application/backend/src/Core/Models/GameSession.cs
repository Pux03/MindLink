using Core.Enums;

namespace Core.Models
{

    public class GameSession
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public Board Board { get; set; } = new Board();
        public Team RedTeam { get; set; } = new Team();
        public Team BlueTeam { get; set; } = new Team();
        public TeamColor CurrentTeam { get; set; } = TeamColor.Blue;
        public GameStatus Status { get; set; } = GameStatus.Active;
        public TeamColor? Winner { get; set; } = null;
        public List<Guess> GuessHistory { get; set; } = [];
        public List<Hint> HintHistory { get; set; } = [];
        public DateTime StartTime { get; set; } = DateTime.UtcNow;
        public DateTime? EndTime { get; set; }

        // TODO
        public List<Player> Players { get; set; } = [];

        // TODO
        public void AddGuess(Guess guess)
        {
            GuessHistory.Add(guess);
        }
        public void SwitchTeam()
        {
            CurrentTeam = CurrentTeam == TeamColor.Blue ? TeamColor.Red : TeamColor.Blue;
        }
    }

}
