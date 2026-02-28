using System.ComponentModel.DataAnnotations;
using Core.Enums;

namespace Core.Models
{
    public class Team
    {
        public int Id { get; set; }
        [StringLength(20, MinimumLength = 3)]
        public string? Name { get; set; }
        public TeamColor Color { get; set; }
        public List<Player> Members { get; set; } = [];
        public int Score { get; set; } = 0;
        
        public Player? GetMindreader()
        {
            return Members.FirstOrDefault(p => p.IsMindreader);
        }
    }
}