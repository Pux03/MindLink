import type { CardData } from "../types";
import { FlipCard } from "./FlipCard";

interface GameBoardProps {
  cards: CardData[];
  selectedCards: number[];
  isMyTurnToGuess: boolean;
  isSpymasterView: boolean;
  blueRemaining: number;
  redRemaining: number;
  onCardClick: (card: CardData) => void;
}

// ── Board ─────────────────────────────────────────────────────────────────────

export const GameBoard = ({
  cards,
  selectedCards,
  isMyTurnToGuess,
  isSpymasterView,
  blueRemaining,
  redRemaining,
  onCardClick,
}: GameBoardProps) => (
  <div className="flex-1 flex flex-col gap-3" style={{ minWidth: 0 }}>
    {/* Score bar */}
    <div className="flex items-center justify-between px-1">
      <span
        className="balatro-title text-2xl balatro-glow-blue"
        style={{ color: "#818cf8" }}
      >
        {blueRemaining}{" "}
        <span
          className="text-sm font-normal"
          style={{ color: "#6366f1", opacity: 0.7 }}
        >
          LEFT
        </span>
      </span>
      <span
        className="text-xs font-mono tracking-[0.3em]"
        style={{ color: "rgba(139,92,246,0.4)" }}
      >
        5 × 5
      </span>
      <span
        className="balatro-title text-2xl balatro-glow-red"
        style={{ color: "#f87171" }}
      >
        <span
          className="text-sm font-normal"
          style={{ color: "#ef4444", opacity: 0.7 }}
        >
          LEFT{" "}
        </span>
        {redRemaining}
      </span>
    </div>

    {/* Card grid */}
    <div
      className="grid grid-cols-5 gap-2 flex-1"
      style={{ alignContent: "start" }}
    >
      {cards.map((card) => (
        <FlipCard
          key={card.position}
          card={card}
          isSelected={selectedCards.includes(card.position)}
          isMyTurnToGuess={isMyTurnToGuess}
          isSpymasterView={isSpymasterView}
          onClick={() => onCardClick(card)}
        />
      ))}
    </div>
  </div>
);
