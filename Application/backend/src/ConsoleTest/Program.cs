using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using AutoMapper;
using Core.Models;
using Core.Enums;
using Persistence.Data;
using Persistence.Mapping;
using Persistence.Repositories;

namespace ConsoleTest
{
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("MindLink Persistence Test Started\n");

            try
            {
                //
                // 1. SETUP - Dependency Injection
                // 
                var services = new ServiceCollection();

                services.AddDbContext<MindLinkDbContext>(options =>
                    options.UseNpgsql("Host=127.0.0.1;Port=5432;Database=mindlinkdb;Username=mindlink;Password=password")
                );

                services.AddAutoMapper(typeof(MappingProfile));

                services.AddScoped<ITeamRepository, TeamRepository>();
                services.AddScoped<IPlayerRepository, PlayerRepository>();
                services.AddScoped<IGameSessionRepository, GameSessionRepository>();
                services.AddScoped<IBoardRepository, BoardRepository>();
                services.AddScoped<IGuessRepository, GuessRepository>();
                services.AddScoped<IHintRepository, HintRepository>();

                var serviceProvider = services.BuildServiceProvider();

                Console.WriteLine("DI Container konfigurisan\n");

                // 
                // 2. TEST 1: Kreiraj Business objekte
                // 
                Console.WriteLine("TEST 1: Kreiranje Business modela");
                
                var blueTeam = new Team
                {
                    Name = "Blue Ninjas",
                    Color = TeamColor.Blue,
                    Score = 0,
                    Members = new List<Player>()
                };

                var redTeam = new Team
                {
                    Name = "Red Dragons",
                    Color = TeamColor.Red,
                    Score = 0,
                    Members = new List<Player>()
                };

                // 
                // 3. Kreiraj igrače
                // 
                var player1 = new Player
                {
                    Username = "Marko",
                    Team = blueTeam,
                    IsMindreader = true,
                    IsPlaying = true
                };

                var player2 = new Player
                {
                    Username = "Ana",
                    Team = blueTeam,
                    IsMindreader = false,
                    IsPlaying = true
                };

                var player3 = new Player
                {
                    Username = "Petar",
                    Team = redTeam,
                    IsMindreader = true,
                    IsPlaying = true
                };

                // Dodaj igrace u timove
                blueTeam.Members.Add(player1);
                blueTeam.Members.Add(player2);
                redTeam.Members.Add(player3);

                // 
                // 4. Kreiraj bord
                // 
                var board = new Board();
                board.Cards.Add(new Card { Position = 0, Word = "PESMA", TeamColor = TeamColor.Blue, IsRevealed = false });
                board.Cards.Add(new Card { Position = 1, Word = "KUCA", TeamColor = TeamColor.Red, IsRevealed = false });
                board.Cards.Add(new Card { Position = 2, Word = "VODA", TeamColor = TeamColor.Blue, IsRevealed = false });
                board.Cards.Add(new Card { Position = 3, Word = "KRST", TeamColor = TeamColor.Red, IsRevealed = false });
                board.Cards.Add(new Card { Position = 4, Word = "ŠUMA", TeamColor = TeamColor.Blue, IsRevealed = false });

                var gameSession = new GameSession
                {
                    Name = "Test Parr",
                    Board = board,
                    RedTeam = redTeam,
                    BlueTeam = blueTeam,
                    CurrentTeam = TeamColor.Blue,
                    Status = GameStatus.Active,
                    StartTime = DateTime.UtcNow
                };

                Console.WriteLine($"Kreirani objekti:");
                Console.WriteLine($"   - Plavi tim: {blueTeam.Name} ({blueTeam.Members.Count} igrača)");
                Console.WriteLine($"   - Crveni tim: {redTeam.Name} ({redTeam.Members.Count} igrača)");
                Console.WriteLine($"   - Tabla: {gameSession.Board.Cards.Count} karata");
                Console.WriteLine($"   - Partija: {gameSession.Name}\n");

                // 
                // 5. TEST 2: Mapiranje u Entity modele
                // 
                Console.WriteLine("TEST 2: Mapiranje Business → Entity");

                var mapper = serviceProvider.GetRequiredService<IMapper>();

                var blueTeamEntity = mapper.Map<Persistence.Entities.TeamEntity>(blueTeam);
                var redTeamEntity = mapper.Map<Persistence.Entities.TeamEntity>(redTeam);
                var boardEntity = mapper.Map<Persistence.Entities.BoardEntity>(board);
                var gameEntity = mapper.Map<Persistence.Entities.GameSessionEntity>(gameSession);

                Console.WriteLine($"Mapiranje uspešno:");
                Console.WriteLine($"   - Plavi tim mapiran: {blueTeamEntity.Name}");
                Console.WriteLine($"   - Crveni tim mapiran: {redTeamEntity.Name}");
                Console.WriteLine($"   - Board mapiran: {boardEntity.Cards.Count} karata (JSONB)");
                Console.WriteLine($"   - GameSession mapiran: {gameEntity.Name}\n");

                // 
                // 6. TEST 3: Upisivanje timova u bazu
                // 
                Console.WriteLine("TEST 3: Upisivanje timova u bazu");

                var teamRepository = serviceProvider.GetRequiredService<ITeamRepository>();

                await teamRepository.AddAsync(blueTeamEntity);
                await teamRepository.SaveChangesAsync();
                Console.WriteLine($"    Tim '{blueTeamEntity.Name}' upisan (ID: {blueTeamEntity.Id})");

                await teamRepository.AddAsync(redTeamEntity);
                await teamRepository.SaveChangesAsync();
                Console.WriteLine($"    Tim '{redTeamEntity.Name}' upisan (ID: {redTeamEntity.Id})\n");

                // 
                // 7. TEST 4: Upisivanje partije u bazu
                // 
                Console.WriteLine("TEST 4: Upisivanje partije u bazu");

                var gameRepository = serviceProvider.GetRequiredService<IGameSessionRepository>();
                
                gameEntity.BlueTeamId = blueTeamEntity.Id;
                gameEntity.RedTeamId = redTeamEntity.Id;

                await gameRepository.AddAsync(gameEntity);
                await gameRepository.SaveChangesAsync();
                Console.WriteLine($"    Partija '{gameEntity.Name}' upisana (ID: {gameEntity.Id})\n");

                // 
                // 8. TEST 5: Upisivanje borda u bazu
                // 
                Console.WriteLine("TEST 5: Upisivanje borda u bazu");

                var boardRepository = serviceProvider.GetRequiredService<IBoardRepository>();
                boardEntity.GameSessionId = gameEntity.Id;
                
                await boardRepository.AddAsync(boardEntity);
                await boardRepository.SaveChangesAsync();
                Console.WriteLine($"Bord upisan (ID: {boardEntity.Id}) sa {boardEntity.Cards.Count} karata\n");

                // 
                // 9. TEST 6: Citanje timova iz baze
                // 
                Console.WriteLine("TEST 6: Citanje timova iz baze");

                var retrievedBlueTeam = await teamRepository.GetTeamWithMembersAsync(blueTeamEntity.Id);
                var retrievedRedTeam = await teamRepository.GetTeamWithMembersAsync(redTeamEntity.Id);

                if (retrievedBlueTeam != null)
                {
                    Console.WriteLine($"  Tim '{retrievedBlueTeam.Name}' ucitan:");
                    Console.WriteLine($"   - Boja: {retrievedBlueTeam.Color}");
                    Console.WriteLine($"   - Članovi: {retrievedBlueTeam.Members.Count}");
                    foreach (var member in retrievedBlueTeam.Members)
                    {
                        Console.WriteLine($"     - {member.Username} (IsMindreader: {member.IsMindreader})");
                    }
                }

                if (retrievedRedTeam != null)
                {
                    Console.WriteLine($"   Tim '{retrievedRedTeam.Name}' učitan:");
                    Console.WriteLine($"   - Boja: {retrievedRedTeam.Color}");
                    Console.WriteLine($"   - Članovi: {retrievedRedTeam.Members.Count}");
                    foreach (var member in retrievedRedTeam.Members)
                    {
                        Console.WriteLine($"     - {member.Username} (IsMindreader: {member.IsMindreader})");
                    }
                }
                Console.WriteLine();

                // 
                // 10. TEST 7: Citanje borda iz baze
                // 
                Console.WriteLine("TEST 7: Citanje borda iz baze");

                var retrievedBoard = await boardRepository.GetBoardWithCardsAsync(boardEntity.Id);

                if (retrievedBoard != null)
                {
                    Console.WriteLine($"   Bord učitan:");
                    Console.WriteLine($"   - ID: {retrievedBoard.Id}");
                    Console.WriteLine($"   - GameSessionId: {retrievedBoard.GameSessionId}");
                    Console.WriteLine($"   - Kartice (JSONB): {retrievedBoard.Cards.Count}");
                    foreach (var card in retrievedBoard.Cards)
                    {
                        Console.WriteLine($"     - Pozicija {card.Position}: {card.Word} ({card.TeamColor}) - Revealed: {card.IsRevealed}");
                    }
                }
                Console.WriteLine();

                // 
                // 11. TEST 8: Citanje partije iz baze
                // 
                Console.WriteLine("📖 TEST 8: Čitanje partije iz baze");

                var retrievedGame = await gameRepository.GetGameWithBoardAndTeamsAsync(gameEntity.Id);
                
                if (retrievedGame != null)
                {
                    Console.WriteLine($"   Partija učitana:");
                    Console.WriteLine($"   - Naziv: {retrievedGame.Name}");
                    Console.WriteLine($"   - ID: {retrievedGame.Id}");
                    Console.WriteLine($"   - Status: {retrievedGame.Status}");
                    Console.WriteLine($"   - Trenutni tim: {retrievedGame.CurrentTeam}");
                    Console.WriteLine($"   - Vreme početka: {retrievedGame.StartTime}");
                    Console.WriteLine($"   - Pobednik: {(retrievedGame.Winner.HasValue ? retrievedGame.Winner.ToString() : "Jos nema")}");
                    
                    if (retrievedGame.BlueTeam != null)
                    {
                        Console.WriteLine($"   - Plavi tim: {retrievedGame.BlueTeam.Name} ({retrievedGame.BlueTeam.Members.Count} clanova)");
                        foreach (var member in retrievedGame.BlueTeam.Members)
                        {
                            Console.WriteLine($"     - {member.Username} (IsMindreader: {member.IsMindreader})");
                        }
                    }
                    
                    if (retrievedGame.RedTeam != null)
                    {
                        Console.WriteLine($"   - Crveni tim: {retrievedGame.RedTeam.Name} ({retrievedGame.RedTeam.Members.Count} clanova)");
                        foreach (var member in retrievedGame.RedTeam.Members)
                        {
                            Console.WriteLine($"     - {member.Username} (IsMindreader: {member.IsMindreader})");
                        }
                    }
                    
                    if (retrievedGame.Board != null)
                    {
                        Console.WriteLine($"   - Bord kartice (JSONB): {retrievedGame.Board.Cards.Count}");
                        foreach (var card in retrievedGame.Board.Cards)
                        {
                            Console.WriteLine($"     - Pozicija {card.Position}: {card.Word} ({card.TeamColor})");
                        }
                    }
                    Console.WriteLine();
                }
                else
                {
                    Console.WriteLine("Partija nije pronadjena!\n");
                }

                // 
                // 12. TEST 9: Mapiranje Entity → Business
                // 
                Console.WriteLine("TEST 9: Mapiranje Entity → Business");

                if (retrievedGame != null)
                {
                    var gameFromEntity = mapper.Map<GameSession>(retrievedGame);
                    
                    Console.WriteLine($"Entity mapiran nazad u Business:");
                    Console.WriteLine($"   - Naziv: {gameFromEntity.Name}");
                    Console.WriteLine($"   - Status: {gameFromEntity.Status}");
                    Console.WriteLine($"   - Bord kartice: {gameFromEntity.Board.Cards.Count}");
                    
                    if (gameFromEntity.BlueTeam != null)
                        Console.WriteLine($"   - Plavi tim: {gameFromEntity.BlueTeam.Name} ({gameFromEntity.BlueTeam.Members.Count} clanova)");
                    
                    if (gameFromEntity.RedTeam != null)
                        Console.WriteLine($"   - Crveni tim: {gameFromEntity.RedTeam.Name} ({gameFromEntity.RedTeam.Members.Count} clanova)");
                    
                    Console.WriteLine();
                }

                // 
                // 13. TEST 10: Citanje svih partija
                // 
                Console.WriteLine("TEST 10: Citanje svih aktivnih partija");

                var allActiveGames = await gameRepository.GetActiveGamesAsync();
                Console.WriteLine($"Aktivne partije: {allActiveGames.Count()}");
                foreach (var game in allActiveGames)
                {
                    Console.WriteLine($"   - {game.Name} (Status: {game.Status})");
                }
                Console.WriteLine();

                
                Console.WriteLine("Svi testov su prosli");
                Console.WriteLine();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Console.WriteLine();
                Console.WriteLine($"\nInner Exception: {ex.InnerException?.Message}");
                Console.WriteLine($"\nStack Trace:\n{ex.StackTrace}");
            }

            Console.ReadKey(); // cisto da saceka
        }
    }
}