using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using Persistence.Repositories;
using Persistence.Mapping;
using API.Services;
using API.MessageQueue;
using API.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<MindLinkDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAutoMapper(typeof(MappingProfile)); // registruje MappingProfile

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// RabbitMQ konekcija - Singleton
builder.Services.AddSingleton(sp => RabbitMqConnection.CreateConnection());

// Publisher - Scoped
builder.Services.AddScoped<IGameEventPublisher, RabbitMqGameEventPublisher>();

// Consumer - BackgroundService
builder.Services.AddHostedService<GameEventConsumer>();

builder.Services.AddSingleton<IGameSessionManager, GameSessionManager>();

builder.Services.AddScoped<IGameSessionService, GameSessionService>();
builder.Services.AddScoped<IGameLogicService, GameLogicService>();
builder.Services.AddScoped<IPlayerService, PlayerService>();

// Repsitoriums
builder.Services.AddScoped<IBoardRepository, BoardRepository>();
builder.Services.AddScoped<IGameSessionRepository, GameSessionRepository>();
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IGuessRepository, GuessRepository>();
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IHintRepository, HintRepository>();

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReact");

app.UseHttpsRedirection();
app.MapControllers();

app.MapHub<GameHub>("/hubs/game");

app.MapGet("/", () => "API radi!");

app.Run();
