using Persistence.Mapping;
using Core.Enums;
using Core.Models;
using Persistence.Repositories;
using AutoMapper;
using Core.Events;
using Persistence.Entities;

namespace API.Services
{
    public class GameLogicService : IGameLogicService
    {
        private readonly IGameSessionRepository _gameRepository;
        private readonly IPlayerRepository _playerRepository;
        private readonly IMapper _mapper;
        private readonly ILogger<GameLogicService> _logger;

        public GameLogicService(
            IGameSessionRepository gameRepository,
            IPlayerRepository playerRepository,
            IMapper mapper,
            ILogger<GameLogicService> logger
            )
        {
            _gameRepository = gameRepository;
            _playerRepository = playerRepository;
            _mapper = mapper;
            _logger = logger;
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
            
            if (player == null) {
                throw new Exception("Player not found");
            }

            var guessedCards = game.Board.Cards
                .Where(c => cardPositions.Contains(c.Position))
                .ToList();

            if (guessedCards.Count != cardPositions.Count)
                throw new Exception("One or more card positions are invalid");

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
                    IsCorrect = card.TeamColor == player.Team?.Color,
                    Timestamp = DateTime.UtcNow
                });
            }   

            var isGameOver = IsGameOver(game);

            TeamColor nextTeam = game.SwitchTeam();

            var (RedTeamRemainingCardsCount, BlueTeamRemainingCardsCount) = game.GetTeamPoints();

            // var gameSessionEntity = await _gameRepository.GetFullGameDetailsAsync(game.Id);
            
            // if (gameSessionEntity != null)
            // {
            //     gameSessionEntity.Board.Cards = _mapper.Map<List<CardEntity>>(game.Board.Cards);

            //     gameSessionEntity.RedTeam.Score = game.RedTeam.Score;
            //     gameSessionEntity.BlueTeam.Score = game.BlueTeam.Score;

            //     var existingPositions = gameSessionEntity.GuessHistory.Select(g => g.CardPosition).ToHashSet();
            //     var newGuesses = game.GuessHistory
            //         .Where(g => !existingPositions.Contains(g.CardPosition))
            //         .Select(g =>
            //         {
            //             var guessEntity = _mapper.Map<GuessEntity>(g);
            //             guessEntity.GameSessionId = gameSessionEntity.Id;
            //             return guessEntity;
            //         })
            //         .ToList();

            //     foreach (var guess in newGuesses)
            //         gameSessionEntity.GuessHistory.Add(guess);

            //     gameSessionEntity.CurrentTeam = game.CurrentTeam;
            //     gameSessionEntity.Status = game.Status;
            //     gameSessionEntity.Winner = game.Winner;
            //     gameSessionEntity.EndTime = game.EndTime;

            //     await _gameRepository.UpdateAsync(gameSessionEntity);
            //     await _gameRepository.SaveChangesAsync();
            // }

            var gameSessionEntity = await _gameRepository.GetFullGameDetailsAsync(game.Id);

            if (gameSessionEntity != null)
            {
                gameSessionEntity.Board.Cards = _mapper.Map<List<CardEntity>>(game.Board.Cards);

                gameSessionEntity.RedTeam.Score = game.RedTeam.Score;
                gameSessionEntity.BlueTeam.Score = game.BlueTeam.Score;

                var existingPositions = gameSessionEntity.GuessHistory.Select(g => g.CardPosition).ToHashSet();
                var newGuesses = game.GuessHistory
                    .Where(g => !existingPositions.Contains(g.CardPosition))
                    .Select(g => new GuessEntity
                    {
                        PlayerId = g.PlayerId,
                        GameSessionId = gameSessionEntity.Id,
                        CardPosition = g.CardPosition,
                        IsCorrect = g.IsCorrect,
                        ExecutedAt = g.Timestamp,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    })
                    .ToList();

                foreach (var guess in newGuesses)
                    gameSessionEntity.GuessHistory.Add(guess);

                gameSessionEntity.CurrentTeam = game.CurrentTeam;
                gameSessionEntity.Status = game.Status;
                gameSessionEntity.Winner = game.Winner;
                gameSessionEntity.EndTime = game.EndTime;

                await _gameRepository.SaveChangesAsync();
            }

            _logger.LogInformation("Guess executed {@Data}", new 
            { 
                GameCode = game.Code, 
                Player = player.GetUsername(),
                Cards = cardPositions,
                IsGameOver = isGameOver
            });

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

        public async Task<HintGivenEvent> GiveHintAsync(GameSession game, Player mindReader, string word, int wordCount)
        {
            _logger.LogInformation("GiveHint debug {@Data}", new 
            { 
                MindReaderId = mindReader.Id,
                MindReaderUserId = mindReader.UserId,
                GameCode = game.Code,
                AllPlayers = game.Players.Select(p => new { p.Id, p.UserId, V = p.GetUsername() })
            });

            game.AddHint(new Hint
            {
                PlayerId = mindReader.Id,
                Word = word,
                WordCount = wordCount
            });

            var entity = await _gameRepository.GetFullGameDetailsAsync(game.Id);
            
            if (entity != null)
            {
                // var hintEntity = _mapper.Map<HintEntity>(new Hint
                // {
                //     PlayerId = mindReader.Id,
                //     Word = word,
                //     WordCount = wordCount
                // });
                // hintEntity.GameSessionId = entity.Id;
                // entity.Hints.Add(hintEntity);

                // await _gameRepository.UpdateAsync(entity);
                // await _gameRepository.SaveChangesAsync();
            
                var hintEntity = new HintEntity
                {
                    PlayerId = mindReader.Id,
                    GameSessionId = entity.Id,
                    Word = word,
                    WordCount = wordCount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                entity.Hints.Add(hintEntity);

                await _gameRepository.SaveChangesAsync();
            }

            _logger.LogInformation("Hint given {@Data}", new 
            { 
                GameCode = game.Code, 
                Player = mindReader.GetUsername(),
                Word = word,
                WordCount = wordCount
            });

            return new HintGivenEvent
            {
                GameCode = game.Code,
                PlayerId = mindReader.Id,
                PlayerUsername = mindReader.GetUsername(),
                Word = word,
                WordCount = wordCount
            };
        }

        public async Task<PlayerTeamChangedEvent> UpdatePlayerTeam(GameSession game, int userId, string teamColor, bool isMindreader)
        {
            if (game.Status != GameStatus.Waiting)
                throw new Exception("Game already started");

            var player = game.Players.FirstOrDefault(p => p.UserId == userId);

            if (player == null)
            {
                _logger.LogWarning("Player not found {@Data}", new { UserId = userId, GameCode = game.Code });
                throw new InvalidOperationException("Player not found");
            }

            game.RedTeam.Members.Remove(player);
            game.BlueTeam.Members.Remove(player);

            var newTeam = teamColor.ToLower() == "red" ? game.RedTeam : game.BlueTeam;
            newTeam.Members.Add(player);
            player.Team = newTeam;
            player.IsMindreader = isMindreader;

            var playerEntity = await _playerRepository.GetByIdAsync(player.Id);
            if (playerEntity != null)
            {
                playerEntity.TeamId = newTeam.Id;
                playerEntity.IsMindreader = isMindreader;
                await _playerRepository.UpdateAsync(playerEntity);
                await _playerRepository.SaveChangesAsync();
            }

            _logger.LogInformation("Player team updated {@Data}", new 
            { 
                GameCode = game.Code, 
                Player = player.GetUsername(), 
                Team = teamColor, 
                IsMindreader = isMindreader 
            });

            return new PlayerTeamChangedEvent
            {
                GameCode = game.Code,
                PlayerName = player.GetUsername(),
                NewTeam = teamColor,
                IsMindreader = isMindreader
            };
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