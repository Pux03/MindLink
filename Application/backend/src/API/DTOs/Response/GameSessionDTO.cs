using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Response
{
    public class GameSessionDTO
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; }
        
        public string Status { get; set; }  // "Waiting", "Active", "GameOver"
        
        public string CurrentTeam { get; set; }  // "Red" ili "Blue"
        
        public string Winner { get; set; }  // "Red", "Blue" ili null
        
        public DateTime StartTime { get; set; }
        
        public DateTime? EndTime { get; set; }
        
        public GameTeamDTO RedTeam { get; set; }
        
        public GameTeamDTO BlueTeam { get; set; }
        
        public List<PlayerDTO> Players { get; set; } = new();
        
        public BoardDTO Board { get; set; }
    }
}