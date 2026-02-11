using Microsoft.EntityFrameworkCore;
using Persistence.Data;
using Persistence.Repositories;
using Persistence.Mapping;
using Npgsql;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<MindLinkDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddAutoMapper(typeof(MappingProfile)); // registruje MappingProfile


builder.Services.AddScoped<IBoardRepository, BoardRepository>();
builder.Services.AddScoped<IGameSessionRepository, GameSessionRepository>();
builder.Services.AddScoped<IPlayerRepository, PlayerRepository>();
builder.Services.AddScoped<IGuessRepository, GuessRepository>();
builder.Services.AddScoped<ITeamRepository, TeamRepository>();
builder.Services.AddScoped<IHintRepository, HintRepository>();

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.MapControllers();
app.MapGet("/", () => "API radi!");

app.Run();
