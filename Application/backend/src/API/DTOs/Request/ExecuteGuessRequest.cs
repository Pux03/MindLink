using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Request
{
    public class ExecuteGuessRequest
    {
        [Required]
        public int GameId { get; set; }
        [Required]
        [Range(0, 24)]
        public int CardPosition { get; set; }
        [Required]
        public int PlayerId { get; set; }
    }
}