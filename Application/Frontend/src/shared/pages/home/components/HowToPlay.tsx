import { useState, useEffect } from "react";
import { FlipCard } from "../../room/components/FlipCard";
import type { CardData } from "../../room/types";

interface HowToPlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Demo sets ─────────────────────────────────────────────────────────────────

interface DemoSet {
  hint: string;
  count: number;
  words: string[]; // 9 words
  correct: number[]; // indices that match the hint (will be teamColor "Red")
}

const DEMO_SETS: DemoSet[] = [
  {
    hint: "OCEAN",
    count: 3,
    words: [
      "WAVE",
      "CASTLE",
      "SHARK",
      "BOOK",
      "CORAL",
      "TRAIN",
      "TIDE",
      "LAMP",
      "SALT",
    ],
    correct: [0, 4, 6],
  },
  {
    hint: "SPACE",
    count: 3,
    words: [
      "ROCKET",
      "GARDEN",
      "STAR",
      "PILLOW",
      "MOON",
      "FORK",
      "ORBIT",
      "CHAIR",
      "DUST",
    ],
    correct: [0, 2, 4],
  },
  {
    hint: "FIRE",
    count: 3,
    words: [
      "SMOKE",
      "RIVER",
      "FLAME",
      "CLOCK",
      "ASH",
      "MIRROR",
      "COAL",
      "BREAD",
      "SPARK",
    ],
    correct: [0, 2, 6],
  },
  {
    hint: "ROYAL",
    count: 3,
    words: [
      "CROWN",
      "BUCKET",
      "THRONE",
      "CABLE",
      "SCEPTRE",
      "SHOE",
      "COURT",
      "FENCE",
      "STAMP",
    ],
    correct: [0, 2, 4],
  },
  {
    hint: "COLD",
    count: 3,
    words: [
      "ICE",
      "HAMMER",
      "FROST",
      "DRUM",
      "SNOW",
      "PENCIL",
      "WIND",
      "GRAPE",
      "BLIZZARD",
    ],
    correct: [0, 2, 4],
  },
];

const STEPS = [
  {
    title: "Spymaster gives a hint",
    desc: "One word + a number. The number tells your team how many cards on the board relate to that word.",
  },
  {
    title: "Operatives select cards",
    desc: "Click cards you think match the hint — up to the number given. When ready, confirm your guess.",
  },
  {
    title: "Reveal & score",
    desc: "Cards flip to show their colour. Find all correct cards to score. Hit a wrong one and your turn ends!",
  },
];

// ── Build CardData from demo set + current state ──────────────────────────────

const buildCards = (
  set: DemoSet,
  selected: number[],
  revealed: boolean,
): CardData[] =>
  set.words.map((word, i) => {
    const isCorrect = set.correct.includes(i);
    const isSelected = selected.includes(i);

    if (revealed && isSelected) {
      return {
        word,
        position: i,
        isRevealed: true,
        teamColor: isCorrect ? "Red" : "Neutral",
      };
    }

    return {
      word,
      position: i,
      isRevealed: false,
      teamColor: null, // operatives don't see color before reveal
    };
  });

// ── Component ─────────────────────────────────────────────────────────────────

export const HowToPlay = ({ isOpen, onClose }: HowToPlayProps) => {
  const [step, setStep] = useState(0);
  const [demoSet, setDemoSet] = useState<DemoSet>(DEMO_SETS[0]);
  const [selected, setSelected] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDemoSet(DEMO_SETS[Math.floor(Math.random() * DEMO_SETS.length)]);
      reset();
    }
  }, [isOpen]);

  const reset = () => {
    setStep(0);
    setSelected([]);
    setRevealed(false);
  };

  const tryAgain = () => {
    setDemoSet(DEMO_SETS[Math.floor(Math.random() * DEMO_SETS.length)]);
    reset();
  };

  const handleCardClick = (card: CardData) => {
    if (step !== 1 || revealed) return;
    const idx = card.position;
    setSelected((prev) =>
      prev.includes(idx)
        ? prev.filter((i) => i !== idx)
        : prev.length < demoSet.count
          ? [...prev, idx]
          : prev,
    );
  };

  const handleReveal = () => {
    if (selected.length === 0) return;
    setRevealed(true);
    setStep(2);
  };

  const cards = buildCards(demoSet, selected, revealed);
  const correctCount = revealed
    ? selected.filter((i) => demoSet.correct.includes(i)).length
    : 0;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,2,24,0.92)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background:
            "linear-gradient(160deg, rgba(20,8,52,0.98) 0%, rgba(12,4,32,0.98) 100%)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: "20px",
          boxShadow:
            "0 0 60px rgba(139,92,246,0.15), 0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(139,92,246,0.2)",
          width: "min(560px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "32px",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "8px",
            color: "rgba(167,139,250,0.6)",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "#c4b5fd";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(139,92,246,0.5)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color =
              "rgba(167,139,250,0.6)";
            (e.currentTarget as HTMLElement).style.borderColor =
              "rgba(139,92,246,0.2)";
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div
            style={{
              color: "rgba(139,92,246,0.5)",
              fontSize: "0.65rem",
              letterSpacing: "0.35em",
              marginBottom: 6,
            }}
          >
            ♠ ♣ ♦ ♥
          </div>
          <h2
            style={{
              fontSize: "2rem",
              color: "#c4b5fd",
              letterSpacing: "0.05em",
              textShadow: "0 0 30px rgba(196,181,253,0.3)",
            }}
          >
            How To Play
          </h2>
        </div>

        {/* Step tabs */}
        <div className="flex justify-center gap-2 mb-5">
          {STEPS.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setStep(i);
                if (i < 2) {
                  setRevealed(false);
                  setSelected([]);
                }
              }}
              style={{
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
                background: step === i ? "rgba(139,92,246,0.2)" : "transparent",
                border: `1px solid ${step === i ? "rgba(139,92,246,0.6)" : "rgba(139,92,246,0.2)"}`,
                color: step === i ? "#c4b5fd" : "rgba(139,92,246,0.35)",
                boxShadow:
                  step === i ? "0 0 12px rgba(139,92,246,0.2)" : "none",
              }}
            >
              {i + 1}. {s.title.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* Step description */}
        <div
          style={{
            background: "rgba(139,92,246,0.06)",
            border: "1px solid rgba(139,92,246,0.15)",
            borderRadius: "12px",
            padding: "12px 16px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: "#a78bfa",
              fontWeight: 700,
              fontSize: "0.78rem",
              marginBottom: 3,
            }}
          >
            {STEPS[step].title}
          </div>
          <div
            style={{
              color: "rgba(196,181,253,0.55)",
              fontSize: "0.72rem",
              lineHeight: 1.5,
            }}
          >
            {STEPS[step].desc}
          </div>
        </div>

        {/* Hint banner */}
        <div
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(240,171,252,0.08), transparent)",
            border: "1px solid rgba(240,171,252,0.2)",
            borderRadius: "10px",
            padding: "9px 20px",
            marginBottom: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              color: "rgba(167,139,250,0.4)",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
            }}
          >
            HINT
          </span>
          <span
            style={{
              fontSize: "1.3rem",
              color: "#f0abfc",
              textShadow: "0 0 12px rgba(240,171,252,0.5)",
            }}
          >
            {demoSet.hint}
          </span>
          <span
            style={{
              background: "rgba(240,171,252,0.12)",
              border: "1px solid rgba(240,171,252,0.3)",
              borderRadius: "6px",
              padding: "2px 8px",
              color: "#e879f9",
              fontWeight: 700,
              fontSize: "0.8rem",
            }}
          >
            ×{demoSet.count}
          </span>
        </div>

        {/* 3×3 grid using FlipCard */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "14px",
          }}
        >
          {cards.map((card) => (
            <FlipCard
              key={`${demoSet.hint}-${card.position}`}
              card={card}
              isSelected={selected.includes(card.position)}
              isMyTurnToGuess={step === 1 && !revealed}
              isSpymasterView={false}
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>

        {/* Action row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            minHeight: 40,
          }}
        >
          {/* Status text */}
          <div style={{ flex: 1 }}>
            {step === 1 && !revealed && (
              <span
                style={{ fontSize: "0.7rem", color: "rgba(139,92,246,0.4)" }}
              >
                {selected.length}/{demoSet.count} selected
              </span>
            )}
            {revealed && (
              <span
                style={{
                  fontSize: "0.72rem",
                  color:
                    correctCount === demoSet.count
                      ? "#6ee7b7"
                      : correctCount > 0
                        ? "#fde047"
                        : "#fca5a5",
                }}
              >
                {correctCount === demoSet.count
                  ? `✓ Perfect! All ${demoSet.count} correct.`
                  : correctCount > 0
                    ? `${correctCount}/${demoSet.count} correct — wrong card ends the turn!`
                    : "✗ No correct cards — turn passes to opponent!"}
              </span>
            )}
          </div>

          {/* CTA button */}
          {step === 0 && (
            <button
              onClick={() => setStep(1)}
              style={{
                background: "linear-gradient(135deg, #5b21b6, #7c3aed)",
                border: "1px solid rgba(167,139,250,0.4)",
                borderRadius: "10px",
                color: "white",
                padding: "8px 20px",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(109,40,217,0.4)",
              }}
            >
              Try it →
            </button>
          )}

          {step === 1 && !revealed && (
            <button
              onClick={handleReveal}
              disabled={selected.length === 0}
              style={{
                background:
                  selected.length > 0
                    ? "linear-gradient(135deg, #92400e, #b45309)"
                    : "rgba(88,28,135,0.2)",
                border: `1px solid ${selected.length > 0 ? "rgba(251,191,36,0.5)" : "rgba(139,92,246,0.15)"}`,
                borderRadius: "10px",
                color: selected.length > 0 ? "#fde047" : "rgba(139,92,246,0.3)",
                padding: "8px 20px",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: selected.length > 0 ? "pointer" : "not-allowed",
                boxShadow:
                  selected.length > 0
                    ? "0 0 16px rgba(245,158,11,0.3)"
                    : "none",
              }}
            >
              Reveal ♣
            </button>
          )}

          {step === 2 && (
            <button
              onClick={tryAgain}
              style={{
                background: "linear-gradient(135deg, #14532d, #166534)",
                border: "1px solid rgba(74,222,128,0.4)",
                borderRadius: "10px",
                color: "#bbf7d0",
                padding: "8px 20px",
                fontSize: "0.72rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: "0 0 16px rgba(74,222,128,0.25)",
              }}
            >
              ↺ Try Again
            </button>
          )}
        </div>

        {/* Rules footer */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(139,92,246,0.12)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "8px",
          }}
        >
          {[
            {
              icon: "♦",
              color: "#f0abfc",
              text: "Spymaster sees all card colours",
            },
            {
              icon: "♠",
              color: "#818cf8",
              text: "Operatives only see unrevealed cards",
            },
            { icon: "💥", color: "#fb923c", text: "Bomb card = instant loss" },
            {
              icon: "♣",
              color: "#fbbf24",
              text: "Find all your cards before the other team",
            },
          ].map((rule, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                background: "rgba(139,92,246,0.04)",
                borderRadius: "8px",
                border: "1px solid rgba(139,92,246,0.1)",
              }}
            >
              <span
                style={{
                  fontSize: "0.85rem",
                  color: rule.color,
                  flexShrink: 0,
                }}
              >
                {rule.icon}
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "rgba(196,181,253,0.55)",
                  lineHeight: 1.3,
                }}
              >
                {rule.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
