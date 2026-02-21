using Core.Models;
using Persistence.Entities;

namespace Persistence.Repositories
{
    public interface IUserRepository : IRepository<UserEntity>
    {
        public Task<UserEntity?> GetByUsernameAsync(string username);
        public Task<UserEntity?> GetByEmailAsync(string email);
        public Task<bool> ExistsAsync(string username, string email);
    }
}