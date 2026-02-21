using System.Text.Json;
using Core.Models;
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
        public DbSet<UserEntity> Users => Set<UserEntity>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // GameSession - Board (one-to-one)
            modelBuilder.Entity<GameSessionEntity>()
                .HasOne(g => g.Board)
                .WithOne()
                .HasForeignKey<BoardEntity>(b => b.GameSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            // GameSession - RedTeam / BlueTeam (two FKs to same table)
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

            // GameSession - enum konverzije
            modelBuilder.Entity<GameSessionEntity>()
                .Property(g => g.CurrentTeam)
                .HasConversion<string>();

            modelBuilder.Entity<GameSessionEntity>()
                .Property(g => g.Status)
                .HasConversion<string>();

            modelBuilder.Entity<GameSessionEntity>()
                .Property(g => g.Winner)
                .HasConversion<string>();

            // Board - Cards kao JSONB
            modelBuilder.Entity<BoardEntity>()
                .Property(b => b.Cards)
                .HasColumnType("jsonb")
                .HasConversion(
                    v => JsonSerializer.Serialize(v, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
                    v => JsonSerializer.Deserialize<List<CardEntity>>(v, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }) ?? new List<CardEntity>()
                );

            // Team - Color enum konverzija
            modelBuilder.Entity<TeamEntity>()
                .Property(t => t.Color)
                .HasConversion<string>();

            // Player - Team (many-to-one)
            modelBuilder.Entity<PlayerEntity>()
                .HasOne(p => p.Team)
                .WithMany(t => t.Members)
                .HasForeignKey(p => p.TeamId)
                .OnDelete(DeleteBehavior.SetNull);

            // Player - User (many-to-one)
            modelBuilder.Entity<PlayerEntity>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Guess - GameSession
            modelBuilder.Entity<GuessEntity>()
                .HasOne(g => g.GameSession)
                .WithMany(gs => gs.GuessHistory)
                .HasForeignKey(g => g.GameSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Guess - Player
            modelBuilder.Entity<GuessEntity>()
                .HasOne(g => g.Player)
                .WithMany(p => p.Guesses)
                .HasForeignKey(g => g.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Hint - GameSession
            modelBuilder.Entity<HintEntity>()
                .HasOne(h => h.GameSession)
                .WithMany(gs => gs.Hints)
                .HasForeignKey(h => h.GameSessionId)
                .OnDelete(DeleteBehavior.Cascade);

            // Hint - Player
            modelBuilder.Entity<HintEntity>()
                .HasOne(h => h.Player)
                .WithMany(p => p.Hints)
                .HasForeignKey(h => h.PlayerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}