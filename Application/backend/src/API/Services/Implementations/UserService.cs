// using System.IdentityModel.Tokens.Jwt;
// using System.Security.Claims;
// using System.Text;
// using API.DTOs.Request;
// using API.DTOs.Response;
// using Microsoft.IdentityModel.Tokens;
// using Persistence.Entities;
// using Persistence.Repositories;

// namespace API.Services
// {
//     public class UserService : IUserService
//     {
//         private readonly IUserRepository _userRepository;
//         private readonly IJwtService _jwtService;

//         public UserService(IUserRepository userRepository, IConfiguration configuration)
//         {
//             _userRepository = userRepository;
//             _configuration = configuration;
//         }

//         public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
//         {
//             var exists = await _userRepository.ExistsAsync(request.Username!, request.Email!);
//             if (exists)
//                 throw new InvalidOperationException("Username or email already exists");

//             var user = new UserEntity
//             {
//                 Username = request.Username!,
//                 Email = request.Email!,
//                 PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
//             };

//             await _userRepository.AddAsync(user);
//             await _userRepository.SaveChangesAsync();

//             return GenerateAuthResponse(user);
//         }

//         public async Task<AuthResponse> LoginAsync(LoginRequest request)
//         {
//             var user = await _userRepository.GetByEmailAsync(request.Email!);

//             if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
//                 throw new UnauthorizedAccessException("Invalid email or password");

//             return GenerateAuthResponse(user);
//         }

//         private AuthResponse GenerateAuthResponse(UserEntity user)
//         {
//             var token = GenerateJwtToken(user);
//             return new AuthResponse
//             {
//                 Token = token,
//                 Username = user.Username,
//                 Email = user.Email,
//                 ExpiresAt = DateTime.UtcNow.AddDays(7)
//             };
//         }

//         private string GenerateJwtToken(UserEntity user)
//         {
//             var key = new SymmetricSecurityKey(
//                 Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

//             var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

//             var claims = new[]
//             {
//                 new Claim("id", user.Id.ToString()),
//                 new Claim("username", user.Username),
//                 new Claim("email", user.Email)
//             };

//             var token = new JwtSecurityToken(
//                 issuer: _configuration["Jwt:Issuer"],
//                 audience: _configuration["Jwt:Audience"],
//                 claims: claims,
//                 expires: DateTime.UtcNow.AddDays(7),
//                 signingCredentials: credentials
//             );

//             return new JwtSecurityTokenHandler().WriteToken(token);
//         }

//         public async Task UpdateUsernameAsync(int userId, string newUsername)
//         {
//             var user = await _userRepository.GetByIdAsync(userId);
//             if (user == null)
//                 throw new InvalidOperationException("User not found");

//             var exists = await _userRepository.GetByUsernameAsync(newUsername);
//             if (exists != null)
//                 throw new InvalidOperationException("Username already taken");

//             user.Username = newUsername;
//             await _userRepository.SaveChangesAsync();
//         }

//         public async Task UpdatePasswordAsync(int userId, string currentPassword, string newPassword)
//         {
//             var user = await _userRepository.GetByIdAsync(userId);
//             if (user == null)
//                 throw new InvalidOperationException("User not found");

//             if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
//                 throw new UnauthorizedAccessException("Current password is incorrect");

//             user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
//             await _userRepository.SaveChangesAsync();
//         }
//     }
// }

using API.DTOs.Request;
using API.DTOs.Response;
using API.Services.Auth;
using Persistence.Entities;
using Persistence.Repositories;

namespace API.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IJwtService _jwtService;

        public UserService(IUserRepository userRepository, IJwtService jwtService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
        }

        public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
        {
            var exists = await _userRepository.ExistsAsync(request.Username!, request.Email!);
            if (exists)
                throw new InvalidOperationException("Username or email already exists");

            var user = new UserEntity
            {
                Username = request.Username!,
                Email = request.Email!,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            await _userRepository.AddAsync(user);
            await _userRepository.SaveChangesAsync();

            return GenerateAuthResponse(user);
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await _userRepository.GetByEmailAsync(request.Email!);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                throw new UnauthorizedAccessException("Invalid email or password");

            return GenerateAuthResponse(user);
        }

        private AuthResponse GenerateAuthResponse(UserEntity user) => new AuthResponse
        {
            Token = _jwtService.GenerateToken(user),
            Username = user.Username,
            Email = user.Email,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        public async Task UpdateUsernameAsync(int userId, string newUsername)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            var exists = await _userRepository.GetByUsernameAsync(newUsername);
            if (exists != null)
                throw new InvalidOperationException("Username already taken");

            user.Username = newUsername;
            await _userRepository.SaveChangesAsync();
        }

        public async Task UpdatePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new InvalidOperationException("User not found");

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
                throw new UnauthorizedAccessException("Current password is incorrect");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _userRepository.SaveChangesAsync();
        }
    }
}