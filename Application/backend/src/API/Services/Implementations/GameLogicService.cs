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

        public async Task<GuessExecutedEvent> ExecuteGuessAsync(GameSession game, int userId, List<int> cardPositions)
        {
            var player = game.Players.FirstOrDefault(p => p.UserId == userId);
            
            if (player == null)
                throw new Exception("Player not found");

            var guessedCards = game.Board.Cards
                .Where(c => cardPositions.Contains(c.Position))
                .ToList();

            if (guessedCards.Count != cardPositions.Count)
                throw new Exception("One or more card positions are invalid");

            foreach (var card in guessedCards)
            {
                card.IsRevealed = true;
            }

            // Saving guesses to history in game session object
            foreach (var card in guessedCards)
            {
                game.AddGuess(new Guess
                {
                    PlayerId = player.Id,
                    CardPosition = card.Position,
                    Timestamp = DateTime.UtcNow
                });
            }   

            var isGameOver = IsGameOver(game);

            //await _gameRepository.UpdateAsync(game);
            return new GuessExecutedEvent
            {
                UserId = userId,
                GuessedCardPositions = cardPositions,
                IsGameOver = isGameOver,
                WinnerTeam = isGameOver ? game.Winner : null
            };
        }

        public Task<HintGivenEvent> GiveHintAsync(GameSession game, Player mindReader, string word, int wordCount)
        {
            throw new NotImplementedException();
        }

        public bool IsGameOver(GameSession game)
        {
            var redCardsRevealed = game.Board.Cards
                .Where(c => c.TeamColor == TeamColor.Red)
                .All(c => c.IsRevealed);

            var blueCardsRevealed = game.Board.Cards
                .Where(c => c.TeamColor == TeamColor.Blue)
                .All(c => c.IsRevealed);

            if (redCardsRevealed)
            {
                game.Winner = TeamColor.Red;
                game.Status = GameStatus.GameOver;
                game.EndTime = DateTime.UtcNow;
                return true;
            }

            if (blueCardsRevealed)
            {
                game.Winner = TeamColor.Blue;
                game.Status = GameStatus.GameOver;
                game.EndTime = DateTime.UtcNow;
                return true;
            }

            return false;
        }
    }
}