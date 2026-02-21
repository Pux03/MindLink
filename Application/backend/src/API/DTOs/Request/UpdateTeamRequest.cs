using System.ComponentModel.DataAnnotations;
using Core.Enums;

namespace API.DTOs.Request
{
    public class UpdateTeamRequest
    {
        [Required]
        public TeamColor? TeamColor { get; set; }
        [Required]
        public bool IsMindreader { get; set; }
    }
}