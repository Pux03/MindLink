using Core.Events;

public class PlayerTeamChangedEvent : GameEvent
{
    public string? PlayerName { get; set; }
    public string? NewTeam { get; set; }
    public bool IsMindreader { get; set; }
}