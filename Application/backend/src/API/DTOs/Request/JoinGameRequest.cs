using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Request
{
    public class JoinGameRequest
    {
        [Required(ErrorMessage = "Player Name is required")]
        public string? PlayerName { get; set; }
        [Required(ErrorMessage = "UserId is required")]
        public string? UserId { get; set; }
    }
}