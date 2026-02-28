using AutoMapper;
using Core.Models;
using Core.Enums;
using Persistence.Entities;

namespace Persistence.Mapping
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // 
            // 1. PLAYER MAPPING
            // 
            CreateMap<Player, PlayerEntity>()
                .ForMember(dest => dest.TeamId, opt => opt.Ignore())
                .ForMember(dest => dest.Team, opt => opt.Ignore())
                .ForMember(dest => dest.Guesses, opt => opt.Ignore())
                .ForMember(dest => dest.Hints, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                
                .ReverseMap()
                .ForMember(dest => dest.Team, 
                    opt => opt.MapFrom(src => src.Team))
                .ForMember(dest => dest.User,      
                    opt => opt.MapFrom(src => src.User));

            // 
            // 2. TEAM MAPPING
            // 
            CreateMap<Team, TeamEntity>()
                .ForMember(dest => dest.Members, opt => opt.MapFrom(src => src.Members))
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                
                .ReverseMap()
                .ForMember(dest => dest.Members, opt => opt.Ignore());

            // 
            // 3. CARD MAPPING 
            //
            CreateMap<Card, CardEntity>()
                // TeamColor (enum) GåÆ TeamColor? (nullable enum)
                .ForMember(dest => dest.TeamColor, 
                    opt => opt.MapFrom(src => src.TeamColor))
                
                .ReverseMap()
                // TeamColor? (nullable enum) GåÆ TeamColor (enum)
                .ForMember(dest => dest.TeamColor, 
                    opt => opt.MapFrom(src => src.TeamColor ?? TeamColor.Blue));

            // 
            // 4. BOARD MAPPING (JSONB Cards)
            // 
            CreateMap<Board, BoardEntity>()
                .ForMember(dest => dest.GameSessionId, opt => opt.Ignore())
                .ForMember(dest => dest.Size, opt => opt.Ignore())
                .ForMember(dest => dest.Cards, opt => opt.MapFrom(src => src.Cards))
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                
                .ReverseMap()
                .ForMember(dest => dest.Cards, opt => opt.MapFrom(src => src.Cards));

            // 
            // 5. GAME SESSION MAPPING
            // 
            CreateMap<GameSession, GameSessionEntity>()
                .ForMember(dest => dest.CurrentTeam, 
                    opt => opt.MapFrom(src => src.CurrentTeam))
                .ForMember(dest => dest.Status, 
                    opt => opt.MapFrom(src => src.Status))
                .ForMember(dest => dest.Winner, 
                    opt => opt.MapFrom(src => src.Winner))
                .ForMember(dest => dest.RedTeam, 
                    opt => opt.MapFrom(src => src.RedTeam))
                .ForMember(dest => dest.BlueTeam, 
                    opt => opt.MapFrom(src => src.BlueTeam))
                .ForMember(dest => dest.Board, 
                    opt => opt.MapFrom(src => src.Board))
                .ForMember(dest => dest.GuessHistory, 
                    opt => opt.MapFrom(src => src.GuessHistory))
                .ForMember(dest => dest.Hints, 
                    opt => opt.MapFrom(src => src.HintHistory))
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                
                .ReverseMap()
                .ForMember(dest => dest.HintHistory, 
                    opt => opt.MapFrom(src => src.Hints))
                .ForMember(dest => dest.Winner, 
                    opt => opt.MapFrom(src => src.Winner))
                .ForMember(dest => dest.RedTeam, 
                    opt => opt.MapFrom(src => src.RedTeam))
                .ForMember(dest => dest.BlueTeam, 
                    opt => opt.MapFrom(src => src.BlueTeam))
                .ForMember(dest => dest.Board, 
                    opt => opt.MapFrom(src => src.Board))
                .ForMember(dest => dest.GuessHistory, 
                    opt => opt.MapFrom(src => src.GuessHistory));

            // 
            // 6. GUESS MAPPING
            // 
            CreateMap<Guess, GuessEntity>()
                .ForMember(dest => dest.GameSessionId, opt => opt.Ignore())
                .ForMember(dest => dest.GameSession, opt => opt.Ignore())
                .ForMember(dest => dest.Index, opt => opt.Ignore())
                .ForMember(dest => dest.CardPosition, 
                    opt => opt.MapFrom(src => src.CardPosition))  // posto vise nema card
                .ForMember(dest => dest.ExecutedAt, 
                    opt => opt.MapFrom(src => src.Timestamp))
                .ForMember(dest => dest.PlayerId, 
                    opt => opt.MapFrom(src => src.Player != null ? src.Player.Id : 0))
                .ForMember(dest => dest.Player, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                
                .ReverseMap()
                .ForMember(dest => dest.Timestamp, 
                    opt => opt.MapFrom(src => src.ExecutedAt));

            // 
            // 7. HINT MAPPING
            // 
            CreateMap<Hint, HintEntity>()
                .ForMember(dest => dest.GameSessionId, opt => opt.Ignore())
                .ForMember(dest => dest.GameSession, opt => opt.Ignore())
                .ForMember(dest => dest.PlayerId, 
                    opt => opt.MapFrom(src => src.Player != null ? src.Player.Id : 0))
                .ForMember(dest => dest.Player, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                
                .ReverseMap();
        }
    }
}