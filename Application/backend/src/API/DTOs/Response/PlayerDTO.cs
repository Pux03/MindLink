using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Response
{
    public class PlayerDTO
    {
        public int Id { get; set; }
        
        [Required]
        public string? PlayerName { get; set; }
        
        public string? TeamColor { get; set; }  // "Red" ili "Blue"
        
        public bool IsMindreader { get; set; }
        
        public bool IsPlaying { get; set; }
    }
}