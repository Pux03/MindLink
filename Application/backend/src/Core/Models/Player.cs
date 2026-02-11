using System.ComponentModel.DataAnnotations;
using Core.Enums;

namespace Core.Models
{
    public class Player
    {
        public int Id { get; set; }

        [StringLength(20, MinimumLength = 4)]
        public string? Username { get; set; }
        public Team? Team { get; set; }
        public required bool IsMindreader { get; set; } = false;
        public required bool IsPlaying { get; set; } = false;
    }
}