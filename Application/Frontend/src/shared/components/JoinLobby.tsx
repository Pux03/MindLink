import { useState, useEffect, useRef, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./joinlobby.css";

interface JoinLobbyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CODE_LENGTH = 8;

export const JoinLobby = ({ isOpen, onClose }: JoinLobbyModalProps) => {
  const navigate = useNavigate();
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCode(Array(CODE_LENGTH).fill(""));
      setError(null);
      // Focus first input after mount
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const triggerShake = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleJoin = () => {
    const fullCode = code.join("").toUpperCase();
    if (fullCode.length < CODE_LENGTH) {
      triggerShake("Enter the full 8-character code");
      return;
    }
    navigate(`/r/${fullCode}`);
    onClose();
  };

  const handleChange = (index: number, value: string) => {
    // Allow paste of full code into any cell
    if (value.length > 1) {
      const cleaned = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, CODE_LENGTH);
      const next = Array(CODE_LENGTH).fill("");
      cleaned.split("").forEach((ch, i) => {
        next[i] = ch;
      });
      setCode(next);
      setError(null);
      const focusIdx = Math.min(cleaned.length, CODE_LENGTH - 1);
      setTimeout(() => inputsRef.current[focusIdx]?.focus(), 0);
      return;
    }

    const char = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const next = [...code];
    next[index] = char;
    setCode(next);
    setError(null);

    if (char && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (code[index]) {
        const next = [...code];
        next[index] = "";
        setCode(next);
      } else if (index > 0) {
        const next = [...code];
        next[index - 1] = "";
        setCode(next);
        inputsRef.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    } else if (e.key === "Enter") {
      handleJoin();
    }
  };

  const filledCount = code.filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="join-modal-backdrop fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(5,2,15,0.85)", backdropFilter: "blur(6px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Card */}
        <div
          className={`join-modal-card ${shaking ? "shaking" : ""}`}
          style={{
            background:
              "linear-gradient(160deg, rgba(22,10,55,0.98) 0%, rgba(12,4,32,0.98) 100%)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "20px",
            boxShadow:
              "0 24px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(139,92,246,0.2), 0 0 60px rgba(88,28,135,0.15)",
            padding: "40px 48px",
            width: "520px",
            maxWidth: "calc(100vw - 32px)",
            position: "relative",
          }}
        >
          {/* Corner suit decorations */}
          <span
            style={{
              position: "absolute",
              top: 14,
              left: 18,
              fontSize: 14,
              opacity: 0.12,
              color: "#c4b5fd",
              userSelect: "none",
            }}
          >
            ♠
          </span>
          <span
            style={{
              position: "absolute",
              top: 14,
              right: 18,
              fontSize: 14,
              opacity: 0.12,
              color: "#c4b5fd",
              userSelect: "none",
            }}
          >
            ♣
          </span>
          <span
            style={{
              position: "absolute",
              bottom: 14,
              left: 18,
              fontSize: 14,
              opacity: 0.12,
              color: "#c4b5fd",
              userSelect: "none",
            }}
          >
            ♦
          </span>
          <span
            style={{
              position: "absolute",
              bottom: 14,
              right: 18,
              fontSize: 14,
              opacity: 0.12,
              color: "#c4b5fd",
              userSelect: "none",
            }}
          >
            ♥
          </span>

          {/* Close button */}
          <button
            onClick={onClose}
            className="join-close-btn absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-sm"
          >
            ✕
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="text-xs tracking-[0.35em] uppercase mb-3"
              style={{
                color: "rgba(139,92,246,0.5)",
                fontFamily: "'Lilita One', cursive",
              }}
            >
              ♦ Enter Room Code ♦
            </div>
            <h2
              style={{
                fontSize: "2.6rem",
                lineHeight: 1,
                color: "#c4b5fd",
                fontFamily: "'Lilita One', cursive",
                textShadow: "0 0 30px rgba(196,181,253,0.4)",
                letterSpacing: "0.03em",
              }}
            >
              Join<span style={{ color: "#818cf8" }}>Lobby</span>
            </h2>
          </div>

          {/* Code inputs */}
          <div className="flex items-center justify-center gap-2 mb-3">
            {Array.from({ length: CODE_LENGTH }).map((_, i) => (
              <>
                {i === 4 && (
                  <span key="sep" className="join-separator">
                    —
                  </span>
                )}
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  className={`join-code-input ${code[i] ? "filled" : ""}`}
                  type="text"
                  inputMode="text"
                  maxLength={CODE_LENGTH} // allow paste
                  value={code[i]}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onFocus={(e) => e.target.select()}
                  autoComplete="off"
                  spellCheck={false}
                />
              </>
            ))}
          </div>

          {/* Progress bar */}
          <div
            className="mx-auto mb-5"
            style={{
              width: "100%",
              height: "2px",
              background: "rgba(139,92,246,0.1)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              className="join-progress-bar"
              style={{ width: `${(filledCount / CODE_LENGTH) * 100}%` }}
            />
          </div>

          {/* Error */}
          <div
            style={{
              minHeight: "20px",
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            {error && (
              <span
                style={{
                  color: "#f87171",
                  fontSize: "0.75rem",
                  letterSpacing: "0.1em",
                  fontFamily: "'Lilita One', cursive",
                }}
              >
                ✗ {error}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="join-close-btn flex-1 py-3 text-sm tracking-widest uppercase"
              style={{ fontFamily: "'Lilita One', cursive" }}
            >
              Cancel
            </button>
            <button
              onClick={handleJoin}
              disabled={filledCount < CODE_LENGTH}
              className="join-submit-btn flex-1 py-3 text-sm tracking-widest uppercase"
            >
              ♠ Join Game
            </button>
          </div>

          {/* Hint */}
          <p
            className="text-center mt-4 text-xs"
            style={{ color: "rgba(139,92,246,0.3)", letterSpacing: "0.1em" }}
          >
            You can also paste the full code into any cell
          </p>
        </div>
      </div>
    </>
  );
};
