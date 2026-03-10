using Persistence.Entities;

namespace API.Services.Auth
{
    public interface IJwtService
    {
        string GenerateToken(UserEntity user);
    }
}