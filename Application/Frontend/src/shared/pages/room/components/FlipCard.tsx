import { useState, useEffect, useRef } from "react";
import type { CardData } from "../types";

export interface FlipCardProps {
  card: CardData;
  isSelected: boolean;
  isMyTurnToGuess: boolean;
  isSpymasterView: boolean;
  onClick: () => void;
}

const spymasterDot: Record<string, string> = {
  Red: "bg-red-500 shadow-[0_0_6px_#ef4444]",
  Blue: "bg-blue-500 shadow-[0_0_6px_#3b82f6]",
  Neutral: "bg-stone-400",
  Bomb: "bg-orange-400 shadow-[0_0_6px_#fb923c]",
};

const revealedClass: Record<string, string> = {
  Red: "balatro-card-red",
  Blue: "balatro-card-blue",
  Neutral: "balatro-card-neutral",
  Bomb: "balatro-card-bomb",
};

const revealedText: Record<string, string> = {
  Red: "text-red-200",
  Blue: "text-blue-200",
  Neutral: "text-stone-300",
  Bomb: "text-orange-300",
};

export const FlipCard = ({
  card,
  isSelected,
  isMyTurnToGuess,
  isSpymasterView,
  onClick,
}: FlipCardProps) => {
  const wasRevealed = useRef(card.isRevealed);

  // flipped = true means card shows its revealed face
  const [flipped, setFlipped] = useState(card.isRevealed);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!wasRevealed.current && card.isRevealed) {
      wasRevealed.current = true;
      setAnimating(true);

      // Swap face at midpoint so the colour appears as card faces away
      const mid = setTimeout(() => setFlipped(true), 220);
      // Mark animation done
      const end = setTimeout(() => setAnimating(false), 600);

      return () => {
        clearTimeout(mid);
        clearTimeout(end);
      };
    }
  }, [card.isRevealed]);

  const tc = card.teamColor ?? "Neutral";
  const canClick = isMyTurnToGuess && !card.isRevealed;

  // Unrevealed face classes
  const frontClass = [
    "balatro-card-unrevealed",
    isSelected ? "balatro-card-selected" : "",
    !isMyTurnToGuess ? "opacity-60 !cursor-not-allowed" : "",
  ].join(" ");

  // Revealed face classes
  const backClass = revealedClass[tc] ?? "balatro-card-neutral";

  return (
    <div style={{ perspective: "900px", minHeight: "72px" }}>
      {/*
        Flip container — rotates around Y axis.
        At 0deg  → front (unrevealed) faces viewer.
        At 180deg → back (revealed) faces viewer.
      */}
      <div
        style={{
          position: "relative",
          width: "100%",
          minHeight: "72px",
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transition: animating
            ? "transform 0.55s cubic-bezier(0.45, 0.05, 0.55, 0.95)"
            : "none",
        }}
      >
        {/* ── Front face — unrevealed ───────────────────────────────────────── */}
        <button
          onClick={canClick ? onClick : undefined}
          disabled={!canClick}
          className={`${frontClass} absolute inset-0 w-full flex items-center justify-center p-3`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            minHeight: "72px",
            outline: "none",
          }}
        >
          <span className="suit-decoration" style={{ top: 4, left: 6 }}>
            ♠
          </span>
          <span
            className="suit-decoration"
            style={{ bottom: 4, right: 6, transform: "rotate(180deg)" }}
          >
            ♠
          </span>

          {isSpymasterView && card.teamColor && (
            <span
              className={`absolute top-2 right-2 w-2 h-2 rounded-full ${spymasterDot[card.teamColor] ?? "bg-white/20"}`}
            />
          )}

          <span
            className="text-violet-100 font-black tracking-wider uppercase"
            style={{ fontSize: "0.8rem", position: "relative", zIndex: 1 }}
          >
            {card.word}
          </span>
        </button>

        {/* ── Back face — revealed ──────────────────────────────────────────── */}
        <div
          className={`${backClass} absolute inset-0 w-full flex items-center justify-center p-3`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            minHeight: "72px",
          }}
        >
          {card.teamColor === "Bomb" && (
            <span className="text-2xl mr-1">💥</span>
          )}
          <span
            className={`${revealedText[tc] ?? "text-white"} font-black tracking-wider uppercase`}
            style={{ fontSize: "0.8rem" }}
          >
            {card.word}
          </span>
        </div>
      </div>
    </div>
  );
};
