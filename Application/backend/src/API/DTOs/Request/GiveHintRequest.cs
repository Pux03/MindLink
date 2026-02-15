using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Request
{
    public class GiveHintRequest
    {
        [Required]
        public int GameId { get; set; }
        [Required]
        public int PlayerId { get; set; }
        [Required]
        [StringLength(15, MinimumLength = 1)]
        public string? Word { get; set; }
        [Required]
        [Range(1, 3)]
        public int WordCount { get; set; }
    }
}