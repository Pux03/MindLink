interface GuessBarProps {
  selectedCards: number[];
  wordCount: number;
  onConfirm: () => void;
}

export const GuessBar = ({
  selectedCards,
  wordCount,
  onConfirm,
}: GuessBarProps) => (
  <div
    className="flex items-center justify-center gap-4 py-2.5 px-6 relative z-10"
    style={{
      background:
        "linear-gradient(90deg, transparent, rgba(250,204,21,0.08), transparent)",
      borderBottom: "1px solid rgba(250,204,21,0.2)",
    }}
  >
    <span
      className="text-xs tracking-widest uppercase"
      style={{ color: "rgba(253,224,71,0.5)" }}
    >
      {selectedCards.length} / {wordCount} selected
    </span>

    {/* Pip indicators */}
    <div className="flex gap-1.5">
      {Array.from({ length: wordCount }).map((_, i) => (
        <div
          key={i}
          className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold"
          style={{
            background:
              i < selectedCards.length
                ? "rgba(250,204,21,0.3)"
                : "rgba(88,28,135,0.3)",
            border: `1px solid ${i < selectedCards.length ? "rgba(253,224,71,0.6)" : "rgba(139,92,246,0.2)"}`,
            color:
              i < selectedCards.length ? "#fde047" : "rgba(139,92,246,0.3)",
          }}
        >
          {i < selectedCards.length ? "♠" : "·"}
        </div>
      ))}
    </div>

    <button
      onClick={onConfirm}
      disabled={selectedCards.length === 0}
      className="px-5 py-1.5 text-xs font-bold tracking-widest uppercase transition-all"
      style={{
        borderRadius: "8px",
        background:
          selectedCards.length > 0
            ? "rgba(250,204,21,0.15)"
            : "rgba(88,28,135,0.15)",
        border: `1px solid ${selectedCards.length > 0 ? "rgba(253,224,71,0.5)" : "rgba(139,92,246,0.15)"}`,
        color: selectedCards.length > 0 ? "#fde047" : "rgba(139,92,246,0.3)",
        cursor: selectedCards.length > 0 ? "pointer" : "not-allowed",
        boxShadow:
          selectedCards.length > 0 ? "0 0 12px rgba(250,204,21,0.15)" : "none",
      }}
    >
      Confirm Guess
    </button>
  </div>
);
