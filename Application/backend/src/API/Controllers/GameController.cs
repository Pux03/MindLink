using Microsoft.AspNetCore.Mvc;
using Core.Models;
using Core.Enums;
using API.DTOs.Request;
using API.DTOs.Response;
using API.Services;
using AutoMapper;
using Microsoft.Extensions.Logging;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Produces("application/json")]
    public class GamesController : ControllerBase
    {
        private readonly IGameSessionService _gameSessionService;
        private readonly IGameLogicService _gameLogicService;
        private readonly IPlayerService _playerService;
        private readonly IGameSessionManager _gameSessionManager;
        private readonly IMapper _mapper;
        private readonly ILogger<GamesController> _logger;

        public GamesController(
            IGameSessionService gameSessionService,
            IGameLogicService gameLogicService,
            IPlayerService playerService,
            IGameSessionManager gameSessionManager,
            IMapper mapper,
            ILogger<GamesController> logger)
        {
            _gameSessionService = gameSessionService;
            _gameLogicService = gameLogicService;
            _playerService = playerService;
            _gameSessionManager = gameSessionManager;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet("all")]
        [ProducesResponseType(typeof(ApiResponse<List<GameSessionDTO>>), StatusCodes.Status200OK)]
        public async Task<ActionResult<ApiResponse<List<GameSessionDTO>>>> GetAllGames()
        {
            try
            {
                var games = await _gameSessionService.GetAllActiveGamesAsync();

                var dtos = games.Select(g => MapToDTO(g)).ToList();

                return Ok(new ApiResponse<List<GameSessionDTO>>
                {
                    Success = true,
                    Message = $"{dtos.Count} games found",
                    Data = dtos
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<List<GameSessionDTO>>
                {
                    Success = false,
                    Message = "Error when finding games",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<GameSessionDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<GameSessionDTO>>> GetGameById(int id)
        {
            try
            {
                var game = _gameSessionManager.GetActiveGame(id);

                if (game == null)
                {
                    game = await _gameSessionService.GetGameByIdAsync(id);
                }

                if (game == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Game not found",
                        Errors = new List<string> { $"Game with id: '{id}' not found" }
                    });
                }

                var dto = MapToDTO(game);

                return Ok(new ApiResponse<GameSessionDTO>
                {
                    Success = true,
                    Message = "Game found",
                    Data = dto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<GameSessionDTO>
                {
                    Success = false,
                    Message = "Error when finding game",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<GameSessionDTO>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<GameSessionDTO>>> CreateGame(
            [FromBody] CreateGameRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Invalid data",
                        Errors = ModelState.Values
                            .SelectMany(v => v.Errors)
                            .Select(e => e.ErrorMessage)
                            .ToList()
                    });
                }

                var game = await _gameSessionService.CreateGameAsync(
                    gameName: request.GameName,
                    redTeamId: 1,
                    blueTeamId: 2
                );

                var player = new Player
                {
                    Username = request.PlayerName,
                    IsPlaying = true,
                    Team = game.RedTeam,  // Default Red tim
                    IsMindreader = false
                };

                game.Players.Add(player);
                game.RedTeam.Members.Add(player);

                var dto = MapToDTO(game);

                return CreatedAtAction(
                    nameof(GetGameById),
                    new { id = game.Id },
                    new ApiResponse<GameSessionDTO>
                    {
                        Success = true,
                        Message = "Game successfully created",
                        Data = dto
                    });
            }
            catch (Exception ex)
            {;
                return StatusCode(500, new ApiResponse<GameSessionDTO>
                {
                    Success = false,
                    Message = "Error when creating new game",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPost("{gameId}/join")]
        [ProducesResponseType(typeof(ApiResponse<GameSessionDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<GameSessionDTO>>> JoinGame(
            int gameId,
            [FromBody] JoinGameRequest request)
        {
            try
            {
                // 1. Validacija
                if (!ModelState.IsValid)
                {
                    return BadRequest(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Invalid data"
                    });
                }

                var game = _gameSessionManager.GetActiveGame(gameId);

                if (game == null)
                {
                    return NotFound(new ApiResponse<GameSessionDTO>
                    {
                        Success = false,
                        Message = "Game not found"
                    });
                }

                if (game.Status != GameStatus.Waiting)
                {
                    return BadRequest(new ApiResponse<GameSessionDTO>
                    {
                        Success = false,
                        Message = "Game already started, cannot join"
                    });
                }

                var player = new Player
                {
                    Username = request.PlayerName,
                    IsPlaying = true,
                    Team = game.BlueTeam,  // Default Blue tim
                    IsMindreader = false
                };

                game.Players.Add(player);
                game.BlueTeam.Members.Add(player);

                var dto = MapToDTO(game);

                return Ok(new ApiResponse<GameSessionDTO>
                {
                    Success = true,
                    Message = $"Player with username: '{request.PlayerName}' joined the game",
                    Data = dto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<GameSessionDTO>
                {
                    Success = false,
                    Message = "Error when joining game",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPut("{gameId}/update-team")]
        [ProducesResponseType(typeof(ApiResponse<GameSessionDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<GameSessionDTO>>> UpdatePlayerTeam(
            int gameId,
            [FromBody] UpdateTeamRequest request)
        {
            try
            {
                var game = _gameSessionManager.GetActiveGame(gameId);

                if (game == null)
                {
                    return NotFound(new ApiResponse<GameSessionDTO>
                    {
                        Success = false,
                        Message = "Game not found"
                    });
                }

                var player = game.Players.FirstOrDefault(p => p.Id == request.PlayerId);

                if (player == null)
                {
                    return NotFound(new ApiResponse<GameSessionDTO>
                    {
                        Success = false,
                        Message = "Player not found"
                    });
                }

                game.RedTeam.Members.Remove(player);
                game.BlueTeam.Members.Remove(player);

                var newTeam = request.TeamColor.ToLower() == "red" ? game.RedTeam : game.BlueTeam;
                newTeam.Members.Add(player);
                player.Team = newTeam;

                player.IsMindreader = request.IsMindreader;

                var dto = MapToDTO(game);

                return Ok(new ApiResponse<GameSessionDTO>
                {
                    Success = true,
                    Message = $"Player with username: '{player.Username}' switched to {request.TeamColor} team",
                    Data = dto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<GameSessionDTO>
                {
                    Success = false,
                    Message = "Error when changing team",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        private GameSessionDTO MapToDTO(GameSession game)
        {
            return new GameSessionDTO
            {
                Id = game.Id,
                Name = game.Name,
                Status = game.Status.ToString(),
                CurrentTeam = game.CurrentTeam.ToString(),
                Winner = game.Winner?.ToString(),
                StartTime = game.StartTime,
                EndTime = game.EndTime,
                RedTeam = new GameTeamDTO
                {
                    Id = game.RedTeam.Id,
                    Name = game.RedTeam.Name,
                    Color = game.RedTeam.Color.ToString(),
                    Score = game.RedTeam.Score,
                    Members = game.RedTeam.Members
                        .Select(p => new PlayerDTO
                        {
                            Id = p.Id,
                            PlayerName = p.Username,
                            TeamColor = p.Team?.Color.ToString(),
                            IsMindreader = p.IsMindreader,
                            IsPlaying = p.IsPlaying
                        }).ToList()
                },
                BlueTeam = new GameTeamDTO
                {
                    Id = game.BlueTeam.Id,
                    Name = game.BlueTeam.Name,
                    Color = game.BlueTeam.Color.ToString(),
                    Score = game.BlueTeam.Score,
                    Members = game.BlueTeam.Members
                        .Select(p => new PlayerDTO
                        {
                            Id = p.Id,
                            PlayerName = p.Username,
                            TeamColor = p.Team?.Color.ToString(),
                            IsMindreader = p.IsMindreader,
                            IsPlaying = p.IsPlaying
                        }).ToList()
                },
                Players = game.Players
                    .Select(p => new PlayerDTO
                    {
                        Id = p.Id,
                        PlayerName = p.Username,
                        TeamColor = p.Team?.Color.ToString(),
                        IsMindreader = p.IsMindreader,
                        IsPlaying = p.IsPlaying
                    }).ToList(),
                Board = new BoardDTO
                {
                    Id = game.Board.Id,
                    Size = game.Board.Size,
                    Cards = game.Board.Cards
                        .Select(c => new CardDTO
                        {
                            Word = c.Word,
                            TeamColor = c.TeamColor.ToString(),
                            IsRevealed = c.IsRevealed,
                            Position = c.Position
                        }).ToList()
                }
            };
        }
    }
}