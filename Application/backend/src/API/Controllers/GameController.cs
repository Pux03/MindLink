using Microsoft.AspNetCore.Mvc;
using Core.Models;
using Core.Enums;
using API.DTOs.Request;
using API.DTOs.Response;
using API.Services;
using AutoMapper;
using Microsoft.Extensions.Logging;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace API.Controllers
{
    [Authorize]
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

                var dtos = games.Select(MapToDTO).ToList();

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

        [HttpGet("{gameCode}")]
        [ProducesResponseType(typeof(ApiResponse<GameSessionDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<ActionResult<ApiResponse<GameSessionDTO>>> GetGameById(string gameCode)
        {
            try
            {
                var game = _gameSessionManager.GetActiveGame(gameCode);

                if (game == null)
                {
                    game = await _gameSessionService.GetGameByIdAsync(gameCode);
                }

                if (game == null)
                {
                    return NotFound(new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Game not found",
                        Errors = new List<string> { $"Game with id: '{gameCode}' not found" }
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

        [HttpPost("create")]
        [ProducesResponseType(typeof(ApiResponse<GameSessionDTO>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<GameSessionDTO>>> CreateGame([FromBody] CreateGameRequest request)
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

                var currentUserId = GetCurrentUserId();
                var game = await _gameSessionService.CreateGameAsync(request.Code, request.RedTeamName, request.BlueTeamName);
                game.CreatedByUserId = currentUserId;

                var player = new Player
                {   
                    User = new User { Id = GetCurrentUserId(), Username = GetCurrentUsername() },
                    UserId = currentUserId,
                    IsPlaying = true,
                    Team = null,
                    IsMindreader = false
                };

                game.Players.Add(player);
                _gameSessionManager.AddActiveGame(game);

                var dto = MapToDTO(game);

                return StatusCode(201, new ApiResponse<GameSessionDTO>
                {
                    Success = true,
                    Message = "Game successfully created",
                    Data = dto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ApiResponse<GameSessionDTO>
                {
                    Success = false,
                    Message = "Error when creating new game",
                    Errors = new List<string> { ex.Message }
                });
            }
        }

        [HttpPost("{gameCode}/join")]
        [ProducesResponseType(typeof(ApiResponse<GameSessionDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<ActionResult<ApiResponse<GameSessionDTO>>> JoinGame(
            string gameCode,
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

                var game = _gameSessionManager.GetActiveGame(gameCode);

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
                    User = new User { Id = GetCurrentUserId(), Username = GetCurrentUsername() },
                    UserId = GetCurrentUserId(),
                    IsPlaying = true,
                    Team = null,
                    IsMindreader = false
                };

                game.Players.Add(player);

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

        // [HttpPut("{gameCode}/update-team")]
        // [ProducesResponseType(typeof(ApiResponse<GameSessionDTO>), StatusCodes.Status200OK)]
        // [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        // public async Task<ActionResult<ApiResponse<GameSessionDTO>>> UpdatePlayerTeam(
        //     string gameCode,
        //     [FromBody] UpdateTeamRequest request)
        // {
        //     try
        //     {
        //         var game = _gameSessionManager.GetActiveGame(gameCode);

        //         // Game not active
        //         if (game == null)
        //         {
        //             return NotFound(new ApiResponse<GameSessionDTO>
        //             {
        //                 Success = false,
        //                 Message = "Game not found"
        //             });
        //         }

        //         if (game.Status != GameStatus.Waiting)
        //         {
        //             return NotFound(new ApiResponse<GameSessionDTO>
        //             {
        //                 Success = false,
        //                 Message = "Game has already been started"
        //             });
        //         }

        //         var player = game.Players.FirstOrDefault(p => p.Id == GetCurrentUserId());
                
        //         // If player is not part of the game
        //         if (player == null)
        //         {
        //             return NotFound(new ApiResponse<GameSessionDTO>
        //             {
        //                 Success = false,
        //                 Message = "Player not found"
        //             });
        //         }

        //         game.RedTeam.Members.Remove(player);
        //         game.BlueTeam.Members.Remove(player);

        //         var newTeam = request.TeamColor == TeamColor.Red ? game.RedTeam : game.BlueTeam;
        //         newTeam.Members.Add(player);
        //         player.Team = newTeam;
        //         player.IsMindreader = request.IsMindreader;

        //         player.IsMindreader = request.IsMindreader;

        //         var dto = MapToDTO(game);

        //         return Ok(new ApiResponse<GameSessionDTO>
        //         {
        //             Success = true,
        //             Message = $"Player with username: '{player.GetUsername()}' switched to {request.TeamColor} team",
        //             Data = dto
        //         });
        //     }
        //     catch (Exception ex)
        //     {
        //         return StatusCode(500, new ApiResponse<GameSessionDTO>
        //         {
        //             Success = false,
        //             Message = "Error when changing team",
        //             Errors = new List<string> { ex.Message }
        //         });
        //     }
        // }

        private GameSessionDTO MapToDTO(GameSession game)
        {
            return new GameSessionDTO
            {
                Code = game.Code,
                Status = game.Status.ToString(),
                CurrentTeam = game.CurrentTeam,
                Winner = game?.Winner?.ToString(),
                StartTime = game.StartTime,
                EndTime = game.EndTime,
                RedTeam = new GameTeamDTO
                {
                    Name = game.RedTeam.Name,
                    Color = game.RedTeam.Color.ToString(),
                    Score = game.RedTeam.Score,
                    Members = game.RedTeam.Members
                        .Select(p => new PlayerDTO
                        {
                            Id = p.Id,
                            PlayerName = p.GetUsername(),
                            TeamColor = p.Team?.Color.ToString(),
                            IsMindreader = p.IsMindreader,
                            IsPlaying = p.IsPlaying
                        }).ToList()
                },
                BlueTeam = new GameTeamDTO
                {
                    Name = game.BlueTeam.Name,
                    Color = game.BlueTeam.Color.ToString(),
                    Score = game.BlueTeam.Score,
                    Members = game.BlueTeam.Members
                        .Select(p => new PlayerDTO
                        {
                            Id = p.Id,
                            PlayerName = p.GetUsername(),
                            TeamColor = p.Team?.Color.ToString(),
                            IsMindreader = p.IsMindreader,
                            IsPlaying = p.IsPlaying
                        }).ToList()
                },
                Players = game.Players
                    .Select(p => new PlayerDTO
                    {
                        Id = p.Id,
                        PlayerName = p.GetUsername(),
                        TeamColor = p.Team?.Color.ToString(),
                        IsMindreader = p.IsMindreader,
                        IsPlaying = p.IsPlaying
                    }).ToList(),
                // Board = new BoardDTO
                // {
                //     Id = game.Board.Id,
                //     Size = game.Board.Size,
                //     Cards = game.Board.Cards
                //         .Select(c => new CardDTO
                //         {
                //             Word = c.Word,
                //             TeamColor = c.TeamColor.ToString(),
                //             IsRevealed = c.IsRevealed,
                //             Position = c.Position
                //         }).ToList()
                // }
                Board = null
            };
        }

        private int GetCurrentUserId()
        {
            var claim = User.FindFirst("id");
            if (claim == null)
                throw new UnauthorizedAccessException("User not authenticated");
            return int.Parse(claim.Value);
        }

        private string GetCurrentUsername()
        {
            return User.FindFirst("username")?.Value ?? "Guest";
        }
    }
}