using System.ComponentModel.DataAnnotations;
using Core.Enums;

namespace API.DTOs.Response
{
    public class GameSessionDTO
    {
        public string Code { get; set; }
        public string Status { get; set; }  // "Waiting", "Active", "GameOver"
        
        public TeamColor CurrentTeam { get; set; }  // "Red" ili "Blue"
        
        public string Winner { get; set; }  // "Red", "Blue" ili null
        
        public DateTime StartTime { get; set; }
        
        public DateTime? EndTime { get; set; }
        
        public GameTeamDTO RedTeam { get; set; }
        
        public GameTeamDTO BlueTeam { get; set; }
        
        public List<PlayerDTO> Players { get; set; } = new();
        
        public BoardDTO Board { get; set; }
    }
}