using System.ComponentModel.DataAnnotations;
using System.Runtime.CompilerServices;
using Core.Enums;

namespace Core.Models;

public class Card
{
    // public int Id { get; set; } // Ne treba jer ga cuvamo kao json u bazi
    
    [StringLength(15, MinimumLength = 1)]
    public string Word { get; set; } = string.Empty;
    public TeamColor TeamColor { get; set; }
    public bool IsRevealed { get; set; } = false;
    public int Position { get; set; } 
}