using System.ComponentModel.DataAnnotations.Schema;

namespace Persistence.Entities
{
    [Table("users")]
    public class UserEntity : BaseEntity
    {
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
    }
}