using Persistence.Mapping;
using Core.Enums;
using Core.Models;
using Persistence.Repositories;
using AutoMapper;
using Core.Events;

namespace API.Services
{
    public class GameLogicService : IGameLogicService
    {
        private readonly IGameSessionRepository _gameRepository;
        private readonly IMapper _mapper;

        public GameLogicService(
            IGameSessionRepository gameRepository,
            IMapper mapper
            //ILogger<GameLogicService> logger
            )
        {
            _gameRepository = gameRepository;
            _mapper = mapper;
            //_logger = logger;
        }


        public bool CanPlayerGuess(GameSession game, Player player)
        {
            if (game.Status != GameStatus.Active)
            {
                return false;
            }

            if (!player.IsPlaying)
            {
                return false;
            }

            if (player.IsMindreader)
            {
                return false;
            }

            var playerTeam = player.Team;

            if (player.Team?.Color != game.CurrentTeam)
            {
                return false;
            }

            return true;
        }

        public TeamColor? DetermineWinner(GameSession game)
        {
            throw new NotImplementedException();
        }

        public Task<GuessExecutedEvent> ExecuteGuessAsync(GameSession game, Player player, int cardPosition)
        {
            throw new NotImplementedException();
        }

        public Task<HintGivenEvent> GiveHintAsync(GameSession game, Player mindReader, string word, int wordCount)
        {
            throw new NotImplementedException();
        }

        public bool isGameOver(GameSession game)
        {
            throw new NotImplementedException();
        }
    }
}