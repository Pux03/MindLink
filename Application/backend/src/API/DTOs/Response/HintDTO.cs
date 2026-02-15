using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Response
{
    public class HintDTO
    {
        public int Id { get; set; }
        
        [Required]
        public string Word { get; set; }

        [Required]        
        public int WordCount { get; set; }
        
        public PlayerDTO Player { get; set; }
        
        public DateTime CreatedAt { get; set; }
    }
}