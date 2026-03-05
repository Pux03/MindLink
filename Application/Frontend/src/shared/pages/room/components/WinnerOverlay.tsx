interface WinnerOverlayProps {
  winner: string | null | undefined;
  onNavigateHome: () => void;
}

export const WinnerOverlay = ({
  winner,
  onNavigateHome,
}: WinnerOverlayProps) => (
  <div
    className="fixed inset-0 flex items-center justify-center z-50"
    style={{ background: "rgba(10,2,30,0.92)", backdropFilter: "blur(8px)" }}
  >
    <div className="text-center space-y-8">
      <div
        className="text-xs tracking-[0.4em] uppercase mb-2"
        style={{ color: "rgba(139,92,246,0.6)" }}
      >
        Game Over
      </div>
      <div
        className="balatro-title"
        style={{
          fontSize: "6rem",
          lineHeight: 1,
          color:
            winner === "Red"
              ? "#f87171"
              : winner === "Blue"
                ? "#818cf8"
                : "#c4b5fd",
          textShadow:
            winner === "Red"
              ? "0 0 40px rgba(239,68,68,0.6), 0 0 80px rgba(239,68,68,0.3)"
              : "0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.3)",
        }}
      >
        {winner ?? "No Winner"}
      </div>
      {winner && (
        <div
          className="balatro-title text-3xl"
          style={{ color: "rgba(196,181,253,0.7)" }}
        >
          Wins the Round!
        </div>
      )}
      <button
        onClick={onNavigateHome}
        className="balatro-btn balatro-btn-start px-10 py-3 text-base uppercase"
      >
        Back to Lobby
      </button>
    </div>
  </div>
);
