namespace API.DTOs.Response
{
    public class GameTeamDTO
    {
        public int Id { get; set; }
        
        public string? Name { get; set; }
        
        public string? Color { get; set; }  // "Red" ili "Blue"
        
        public int Score { get; set; }
        
        public List<PlayerDTO> Members { get; set; } = new();
    }
}