using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Request
{
    public class CreateGameRequest
    {
        [Required(ErrorMessage = "Game Name is required")]
        public string? GameName { get; set; }
        [Required(ErrorMessage = "Player Name is required")]
        public string? PlayerName { get; set; }
        [Required(ErrorMessage = "UserId is required")]
        public string? UserId { get; set; }
    }
}