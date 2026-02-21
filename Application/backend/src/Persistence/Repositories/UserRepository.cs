using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using Persistence.Entities;

namespace Persistence.Repositories
{
    public class UserRepository : RepositoryBase<UserEntity>, IUserRepository
    {
        public UserRepository(MindLinkDbContext context) : base(context) { }
        
        public async Task<UserEntity?> GetByUsernameAsync(string username)
        {
            return await _dbSet
                .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
        }

        public async Task<UserEntity?> GetByEmailAsync(string email)
        {
            return await _dbSet
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        }

        public async Task<bool> ExistsAsync(string username, string email)
        {
            return await _dbSet
                .AnyAsync(u => u.Username.ToLower() == username.ToLower() 
                            || u.Email.ToLower() == email.ToLower());
        }
    }
}
