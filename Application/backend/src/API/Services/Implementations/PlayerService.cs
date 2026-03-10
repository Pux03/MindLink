using AutoMapper;
using Core.Models;
using Persistence.Entities;
using Persistence.Repositories;

namespace API.Services
{
    public class PlayerService : IPlayerService
    {
        private readonly IPlayerRepository _playerRepository;
        private readonly IUserRepository _userRepository;
        private readonly IGameSessionRepository _gameRepository;
        private readonly IMapper _mapper;

        public PlayerService(
            IPlayerRepository playerRepository,
            IUserRepository userRepository,
            IGameSessionRepository gameRepository,
            IMapper mapper
        )
        {
            _playerRepository = playerRepository;
            _userRepository = userRepository;
            _gameRepository = gameRepository;
            _mapper = mapper;
        }

        public async Task<Player> CreatePlayerAsync(int userId, string? username = null)
        {
            var userEntity = await _userRepository.GetByIdAsync(userId);

            var playerEntity = new PlayerEntity
            {
                UserId = userId,
                IsPlaying = true,
                IsMindreader = false
            };

            await _playerRepository.AddAsync(playerEntity);
            await _playerRepository.SaveChangesAsync();

            return new Player
            {
                Id = playerEntity.Id,
                UserId = userId,
                User = new User { Id = userId, Username = username ?? userEntity?.Username },
                IsPlaying = true,
                IsMindreader = false
            };
        }

        public async Task<Player> JoinGameAsync(int gameId, int playerId)
        {
            try
            {
                var playerEntity = await _playerRepository.GetByIdAsync(playerId);

                if (playerEntity == null)
                {
                    throw new InvalidOperationException("Player not found");
                }

                var gameEntity = await _gameRepository.GetByIdAsync(gameId);

                if (gameEntity == null)
                {
                    throw new InvalidOperationException("Game not found");
                }

                playerEntity.IsPlaying = false;

                await _playerRepository.UpdateAsync(playerEntity);
                await _playerRepository.SaveChangesAsync();

                return _mapper.Map<Player>(playerEntity);
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        public async Task<Player> LeaveGameAsync(int gameId, int playerId)
        {
            try
            {
                var playerEntity = await _playerRepository.GetByIdAsync(playerId);

                if (playerEntity == null)
                {
                    throw new InvalidOperationException("Player not found");
                }

                playerEntity.IsPlaying = false;

                await _playerRepository.UpdateAsync(playerEntity);
                await _playerRepository.SaveChangesAsync();

                return _mapper.Map<Player>(playerEntity);
            }
            catch (Exception ex)
            {
                throw;
            }
        }
        public async Task<Player> SetMindreaderAsync(int playerId, bool isMindreader)
        {
            try
            {
                var playerEntity = await _playerRepository.GetByIdAsync(playerId);

                if (playerEntity == null)
                {
                    throw new InvalidOperationException("Player not found");
                }

                playerEntity.IsMindreader = isMindreader;

                await _playerRepository.UpdateAsync(playerEntity);
                await _playerRepository.SaveChangesAsync();

                return _mapper.Map<Player>(playerEntity);
            }
            catch (Exception ex)
            {
                throw;
            }
        }
    }
}