using API.DTOs.Response;
using AutoMapper;
using Persistence.Repositories;

namespace API.Services
{
    public class PlayerStatsService : IPlayerStatsService
{
    private readonly IGameSessionRepository _gameRepository;
    private readonly IMapper _mapper;

    public PlayerStatsService(IGameSessionRepository gameRepository, IMapper mapper)
    {
        _gameRepository = gameRepository;
        _mapper = mapper;
    }

    public async Task<PlayerStatsDto> GetPlayerStatsAsync(int userId)
    {
        var games = await _gameRepository.GetGamesByUserIdAsync(userId);

        int gamesPlayed = 0, wins = 0, asSpymaster = 0, asOperative = 0;
        int correctGuesses = 0, wrongGuesses = 0, hintsGiven = 0;

        foreach (var game in games)
        {
            var player = game.RedTeam.Members.FirstOrDefault(p => p.UserId == userId)
                      ?? game.BlueTeam.Members.FirstOrDefault(p => p.UserId == userId);

            if (player == null) continue;

            gamesPlayed++;

            //var playerTeam = game.RedTeam.Members.Contains(player) ? game.RedTeam : game.BlueTeam;
            var playerTeam = game.RedTeam.Members.Any(p => p.Id == player.Id) ? game.RedTeam : game.BlueTeam;
            
            if (game.Winner == playerTeam.Color) wins++;

            if (player.IsMindreader) asSpymaster++;
            else asOperative++;

            correctGuesses += game.GuessHistory.Count(g => g.PlayerId == player.Id && g.IsCorrect);
            wrongGuesses += game.GuessHistory.Count(g => g.PlayerId == player.Id && !g.IsCorrect);
            hintsGiven += game.Hints.Count(h => h.PlayerId == player.Id);
        }

        int losses = gamesPlayed - wins;
        int winRate = gamesPlayed > 0 ? (int)Math.Round((double)wins / gamesPlayed * 100) : 0;

        return new PlayerStatsDto
        {
            GamesPlayed = gamesPlayed,
            Wins = wins,
            Losses = losses,
            WinRate = winRate,
            AsSpymaster = asSpymaster,
            AsOperative = asOperative,
            CorrectGuesses = correctGuesses,
            WrongGuesses = wrongGuesses,
            HintsGiven = hintsGiven
        };
    }

    public async Task<LeaderboardDto> GetLeaderboardAsync()
    {
        var games = await _gameRepository.GetAllFinishedGamesWithPlayersAndGuessesAsync();

        var winsPerUser = new Dictionary<int, (string Username, int Wins)>();
        var guessesPerUser = new Dictionary<int, (string Username, int Guesses)>();

        foreach (var game in games)
        {
            var allPlayers = game.RedTeam.Members.Concat(game.BlueTeam.Members);

            foreach (var player in allPlayers)
            {
                if (player.User == null) continue;

                var userId = player.UserId;
                var username = player.User.Username ?? "Guest";
                //var playerTeam = game.RedTeam.Members.Contains(player) ? game.RedTeam : game.BlueTeam;
                var playerTeam = game.RedTeam.Members.Any(p => p.Id == player.Id) ? game.RedTeam : game.BlueTeam;
                var won = game.Winner == playerTeam.Color ? 1 : 0;
                var correctGuesses = game.GuessHistory.Count(g => g.PlayerId == player.Id && g.IsCorrect);

                if (winsPerUser.ContainsKey(userId))
                    winsPerUser[userId] = (username, winsPerUser[userId].Wins + won);
                else
                    winsPerUser[userId] = (username, won);

                if (guessesPerUser.ContainsKey(userId))
                    guessesPerUser[userId] = (username, guessesPerUser[userId].Guesses + correctGuesses);
                else
                    guessesPerUser[userId] = (username, correctGuesses);
            }
        }

        var mostWins = winsPerUser
            .OrderByDescending(x => x.Value.Wins)
            .Take(10)
            .Select(x => new LeaderboardEntryDto { Username = x.Value.Username, Value = x.Value.Wins })
            .ToList();

        var mostGuesses = guessesPerUser
            .OrderByDescending(x => x.Value.Guesses)
            .Take(10)
            .Select(x => new LeaderboardEntryDto { Username = x.Value.Username, Value = x.Value.Guesses })
            .ToList();

        return new LeaderboardDto
        {
            MostWins = mostWins,
            MostCorrectGuesses = mostGuesses
        };
    }
}
}