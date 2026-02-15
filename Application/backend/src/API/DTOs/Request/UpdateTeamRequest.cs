using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Request
{
    public class UpdateTeamRequest
    {
        [Required]
        public int PlayerId { get; set; }
        [Required]
        [StringLength(10)]
        public string? TeamColor { get; set; }  // "Red" ili "Blue"
        public bool IsMindreader { get; set; }
    }
}