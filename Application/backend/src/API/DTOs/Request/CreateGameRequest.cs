using System.ComponentModel.DataAnnotations;

namespace API.DTOs.Request
{
    public class CreateGameRequest
    {
        public string? Code { get; set; } = string.Empty;
        public string? RedTeamName { get; set; } = string.Empty;
        public string? BlueTeamName { get; set; } = string.Empty;
    }
}