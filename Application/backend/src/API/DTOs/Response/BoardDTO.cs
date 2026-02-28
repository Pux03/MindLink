namespace API.DTOs.Response
{
    public class BoardDTO
    {
        public int Id { get; set; }
        public int Size { get; set; } = 25;
        public List<CardDTO> Cards { get; set; } = [];
    }
}