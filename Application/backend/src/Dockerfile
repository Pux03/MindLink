FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Kopiramo .csproj fajlove odvojeno da iskoristimo Docker keširanje za restaurovanje paketa
COPY ["API/API.csproj", "API/"]
COPY ["Core/Core.csproj", "Core/"]
COPY ["Persistence/Persistence.csproj", "Persistence/"]

# Pokrećemo restore zavisnosti nad glavnim API projektom
RUN dotnet restore "API/API.csproj"

# Kopiramo sav preostali kod
COPY . .

# Build-ujemo i objavljujemo aplikaciju u 'release' modu
WORKDIR "/src/API"
RUN dotnet publish "API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Finalna faza - lagani runtime imidž
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# .NET 8 po defaultu sluša na portu 8080 u kontejneru
EXPOSE 8080
ENTRYPOINT ["dotnet", "API.dll"]