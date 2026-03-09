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

            foreach (var card in guessedCards)
            {
                card.IsRevealed = true;

                if (card.TeamColor == player.Team.Color)
                {
                    player.Team.Score++;
                }
                else if (card.TeamColor != TeamColor.Neutral && card.TeamColor != TeamColor.Bomb)
                {
                    var opposingTeam = game.RedTeam.Color == player.Team.Color ? game.BlueTeam : game.RedTeam;
                    opposingTeam.Score++;
                }
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

            TeamColor nextTeam = game.SwitchTeam();

            var (RedTeamRemainingCardsCount, BlueTeamRemainingCardsCount) = game.GetTeamPoints();

            //await _gameRepository.UpdateAsync(game);

            return new GuessExecutedEvent
            {
                GameCode = game.Code,
                UserId = userId,
                PlayerUsername = player.GetUsername(),
                CurrentTeam = nextTeam,
                RevealedCards = guessedCards,
                RedTeamRemainingCardsCount = RedTeamRemainingCardsCount,
                BlueTeamRemainingCardsCount = BlueTeamRemainingCardsCount,
                IsGameOver = isGameOver,
                WinnerTeam = isGameOver ? game.Winner : null
            };
        }

        public Task<HintGivenEvent> GiveHintAsync(GameSession game, Player mindReader, string word, int wordCount)
        {
            game.AddHint(new Hint
            {
                PlayerId = mindReader.Id,
                Word = word,
                WordCount = wordCount
            });

            return Task.FromResult(new HintGivenEvent
            {
                GameCode = game.Code,
                PlayerId = mindReader.Id,
                PlayerUsername = mindReader.GetUsername(),
                Word = word,
                WordCount = wordCount
            });
        }

        public Task<PlayerTeamChangedEvent> UpdatePlayerTeam(GameSession game, int userId, string teamColor, bool isMindreader)
        {
            if (game.Status != GameStatus.Waiting)
                throw new Exception("Game already started");

            var player = game.Players.FirstOrDefault(p => p.UserId == userId);

            if (player == null)
                throw new Exception("Player not found");

            game.RedTeam.Members.Remove(player);
            game.BlueTeam.Members.Remove(player);

            var newTeam = teamColor.ToLower() == "red" ? game.RedTeam : game.BlueTeam;
            newTeam.Members.Add(player);
            player.Team = newTeam;
            player.IsMindreader = isMindreader;

            return Task.FromResult(new PlayerTeamChangedEvent
            {
                GameCode = game.Code,
                PlayerName = player.GetUsername(),
                NewTeam = teamColor,
                IsMindreader = isMindreader
            });
        }

        public bool IsGameOver(GameSession game)
        {
            var bombRevealed = game.Board.Cards
                .Any(c => c.TeamColor == TeamColor.Bomb && c.IsRevealed);

            if (bombRevealed)
            {
                game.Winner = game.CurrentTeam == TeamColor.Red ? TeamColor.Blue : TeamColor.Red;
                game.Status = GameStatus.GameOver;
                game.EndTime = DateTime.UtcNow;
                return true;
            }

            bool redCardsRevealed = game.Board.Cards
                .Where(c => c.TeamColor == TeamColor.Red)
                .All(c => c.IsRevealed);

            bool blueCardsRevealed = game.Board.Cards
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