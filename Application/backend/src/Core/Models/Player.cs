using System.ComponentModel.DataAnnotations;
using Core.Enums;

namespace Core.Models
{
    public class Player
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public Team? Team { get; set; }
        public bool IsMindreader { get; set; } = false;
        public bool IsPlaying { get; set; } = false;
        public string GetUsername() => User?.Username ?? "Guest";
    }
}