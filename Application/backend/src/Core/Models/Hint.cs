using System.ComponentModel.DataAnnotations;

namespace Core.Models
{
    public class Hint
    {
        public int Id { get; set; }
        public Player? Player { get; set; }
        
        [StringLength(15, MinimumLength = 3)]
        public string? Word { get; set; }
        public int WordCount { get; set; }
    }
}