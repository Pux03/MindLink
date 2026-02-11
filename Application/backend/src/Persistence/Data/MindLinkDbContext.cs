using System.Text.Json;
using Microsoft.EntityFrameworkCore;  
using Persistence.Entities;

namespace Persistence.Data
{
    public class MindLinkDbContext : DbContext
    {
        public MindLinkDbContext(DbContextOptions<MindLinkDbContext> options)
            : base(options) { }

        public DbSet<GameSessionEntity> GameSessions => Set<GameSessionEntity>();
        public DbSet<BoardEntity> Boards => Set<BoardEntity>();
        public DbSet<PlayerEntity> Players => Set<PlayerEntity>();
        public DbSet<TeamEntity> Teams => Set<TeamEntity>();
        public DbSet<GuessEntity> Guesses => Set<GuessEntity>();
        public DbSet<HintEntity> Hints => Set<HintEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<GameSessionEntity>()
                .HasOne(g => g.Board)
                .WithOne()
                .HasForeignKey<BoardEntity>("GameSessionId")
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<GameSessionEntity>()
                .Property(g => g.CurrentTeam)
                .HasConversion<string>();

            modelBuilder.Entity<GameSessionEntity>()
                .Property(g => g.Status)
                .HasConversion<string>();

            modelBuilder.Entity<GameSessionEntity>()
                .Property(g => g.Winner)
                .HasConversion<string>();

            modelBuilder.Entity<BoardEntity>()
                .Property(b => b.Cards)
                .HasColumnType("jsonb")
                .HasConversion(
                    // List<CardEntity> → JSON string
                    v => JsonSerializer.Serialize(v, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
                    
                    // JSON string → List<CardEntity>
                    v => JsonSerializer.Deserialize<List<CardEntity>>(v, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }) ?? new List<CardEntity>()
                );

            modelBuilder.Entity<GuessEntity>()
                .HasOne(g => g.GameSession)
                .WithMany(gs => gs.GuessHistory)
                .HasForeignKey(g => g.GameSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<HintEntity>()
                .HasOne(h => h.GameSession)
                .WithMany(gs => gs.Hints)
                .HasForeignKey(h => h.GameSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PlayerEntity>()
                .HasOne(p => p.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<GameSessionEntity>()
                .HasOne(g => g.RedTeam)
                .WithMany()
                .HasForeignKey(g => g.RedTeamId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<GameSessionEntity>()
                .HasOne(g => g.BlueTeam)
                .WithMany()
                .HasForeignKey(g => g.BlueTeamId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}