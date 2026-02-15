using AutoMapper;
using Core.Models;
using Persistence.Repositories;

namespace API.Services
{
    public class PlayerService : IPlayerService
    {
        private readonly IPlayerRepository _playerRepository;
        private readonly IGameSessionRepository _gameRepository;
        private readonly IMapper _mapper;

        public PlayerService(
            IPlayerRepository playerRepository,
            IGameSessionRepository gameRepository,
            IMapper mapper
        )
        {
            _playerRepository = playerRepository;
            _gameRepository = gameRepository;
            _mapper = mapper;
        }

        public async Task<Player> JoinGameAsync(int gameId, int playerId)
        {
            try
            {
                // Find player
                var playerEntity = await _playerRepository.GetByIdAsync(playerId);

                if (playerEntity == null)
                {
                    throw new InvalidOperationException("Player not found");
                }

                // Find game
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