import { useState } from "react";

interface HintInputProps {
  onGiveHint: (word: string, count: number) => Promise<void>;
}

export const HintInput = ({ onGiveHint }: HintInputProps) => {
  const [hintWord, setHintWord] = useState("");
  const [hintCount, setHintCount] = useState(1);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!hintWord.trim() || hintCount < 1 || sending) return;
    setSending(true);
    try {
      await onGiveHint(hintWord.trim(), hintCount);
      setHintWord("");
      setHintCount(1);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="relative z-10 flex items-center justify-center gap-3 py-3 px-6"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(240,171,252,0.07), transparent)",
        borderBottom: "1px solid rgba(240,171,252,0.2)",
      }}
    >
      <span
        className="text-xs tracking-widest uppercase shrink-0"
        style={{ color: "rgba(240,171,252,0.5)" }}
      >
        ♦ Hint
      </span>

      <input
        type="text"
        value={hintWord}
        onChange={(e) => setHintWord(e.target.value.replace(/\s/g, ""))}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="One word..."
        maxLength={30}
        autoFocus
        className="px-3 py-1.5 text-sm font-bold tracking-widest uppercase"
        style={{
          background: "rgba(88,28,135,0.3)",
          border: "1px solid rgba(240,171,252,0.4)",
          borderRadius: "8px",
          color: "#f0abfc",
          outline: "none",
          width: "160px",
        }}
      />

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setHintCount((n) => Math.max(1, n - 1))}
          className="w-6 h-6 flex items-center justify-center text-sm font-bold"
          style={{
            background: "rgba(88,28,135,0.4)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "5px",
            color: "#a78bfa",
          }}
        >
          −
        </button>
        <span
          className="balatro-title text-xl"
          style={{ color: "#f0abfc", minWidth: "24px", textAlign: "center" }}
        >
          {hintCount}
        </span>
        <button
          onClick={() => setHintCount((n) => n + 1)}
          className="w-6 h-6 flex items-center justify-center text-sm font-bold"
          style={{
            background: "rgba(88,28,135,0.4)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: "5px",
            color: "#a78bfa",
          }}
        >
          +
        </button>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!hintWord.trim() || sending}
        className="px-5 py-1.5 text-xs font-bold tracking-widest uppercase transition-all shrink-0"
        style={{
          borderRadius: "8px",
          background: hintWord.trim()
            ? "rgba(240,171,252,0.15)"
            : "rgba(88,28,135,0.15)",
          border: `1px solid ${hintWord.trim() ? "rgba(240,171,252,0.5)" : "rgba(139,92,246,0.2)"}`,
          color: hintWord.trim() ? "#f0abfc" : "rgba(139,92,246,0.35)",
          cursor: hintWord.trim() ? "pointer" : "not-allowed",
          boxShadow: hintWord.trim()
            ? "0 0 12px rgba(240,171,252,0.15)"
            : "none",
        }}
      >
        {sending ? "Sending..." : "Give Hint"}
      </button>
    </div>
  );
};
