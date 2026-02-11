namespace Core.Models
{

    public class Board
    {
        public int Id { get; set; }
        public int Size { get; set; } = 25; // TODO mozda moze i enum ako imamo odredjeni broj mogucigh velicina 
        public List<Card> Cards { get; set; } = new List<Card>();

        public Card? GetCardAtPosition(int position)
        {
            return Cards.FirstOrDefault(c => c.Position == position);
        }
    }

}