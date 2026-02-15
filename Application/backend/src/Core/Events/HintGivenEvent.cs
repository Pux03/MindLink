namespace Core.Events
{
    public class HintGivenEvent : GameEvent
    {
        public int PlayerId { get; set; }
        public string Word { get; set; }
        public int WordCount { get; set; }

        public override string ToString() 
            => $"Hint: '{Word}' ({WordCount} cards applicable)";
    }
}