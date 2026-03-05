import type { GameRoom } from "../types";

interface TopBarProps {
  game: GameRoom | null;
  roomCode: string | undefined;
  connStatus: string;
  isCopied: boolean;
  isSpymasterView: boolean;
  onCopy: () => void;
  onToggleSpymasterView: () => void;
  onNavigateHome: () => void;
}

const statusColors: Record<string, string> = {
  Connected: "text-emerald-300 border-emerald-400/50 bg-emerald-900/30",
  Connecting: "text-yellow-300 border-yellow-400/50 bg-yellow-900/30",
  Reconnecting: "text-yellow-300 border-yellow-400/50 bg-yellow-900/30",
  Disconnected: "text-red-300 border-red-400/50 bg-red-900/30",
};

const statusDot: Record<string, string> = {
  Connected: "bg-emerald-400 shadow-[0_0_6px_#34d399]",
  Connecting: "bg-yellow-400 animate-pulse shadow-[0_0_6px_#facc15]",
  Reconnecting: "bg-yellow-400 animate-pulse shadow-[0_0_6px_#facc15]",
  Disconnected: "bg-red-400 shadow-[0_0_6px_#f87171]",
};

export const TopBar = ({
  game,
  roomCode,
  connStatus,
  isCopied,
  isSpymasterView,
  onCopy,
  onToggleSpymasterView,
  onNavigateHome,
}: TopBarProps) => (
  <div className="balatro-topbar flex items-center justify-between px-6 py-3 relative z-10">
    <div
      className="balatro-title text-3xl cursor-pointer select-none"
      style={{ color: "#c4b5fd" }}
      onClick={onNavigateHome}
    >
      Mind<span style={{ color: "#818cf8" }}>Link</span>
    </div>

    <div className="flex items-center gap-3">
      {/* Room code */}
      <div className="relative group inline-block">
        <div
          className="px-4 py-1.5 rounded-lg text-sm tracking-widest cursor-pointer"
          onClick={onCopy}
          style={{
            background: "rgba(88,28,135,0.3)",
            border: "1px solid rgba(139,92,246,0.4)",
            color: "#c4b5fd",
            letterSpacing: "0.15em",
          }}
        >
          {isCopied ? "COPIED!" : (game?.code ?? roomCode)}
        </div>
        <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
          {isCopied ? "Copied!" : "Click to copy"}
        </div>
      </div>

      {/* Game status badge */}
      <span
        className="px-3 py-1 text-xs font-bold rounded-full tracking-widest uppercase"
        style={{
          background:
            game?.status === "Playing"
              ? "rgba(16,185,129,0.15)"
              : game?.status === "Ended"
                ? "rgba(100,116,139,0.15)"
                : "rgba(99,102,241,0.15)",
          border: `1px solid ${
            game?.status === "Playing"
              ? "rgba(52,211,153,0.4)"
              : game?.status === "Ended"
                ? "rgba(148,163,184,0.3)"
                : "rgba(129,140,248,0.4)"
          }`,
          color:
            game?.status === "Playing"
              ? "#6ee7b7"
              : game?.status === "Ended"
                ? "#94a3b8"
                : "#a5b4fc",
        }}
      >
        {game?.status ?? "—"}
      </span>

      {/* SignalR status */}
      <span
        className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${statusColors[connStatus] ?? statusColors.Disconnected}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${statusDot[connStatus] ?? statusDot.Disconnected}`}
        />
        {connStatus}
      </span>

      {/* Spymaster view toggle */}
      {game?.status === "Playing" && (
        <button
          onClick={onToggleSpymasterView}
          className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all duration-200"
          style={{
            borderRadius: "8px",
            background: isSpymasterView
              ? "rgba(234,179,8,0.15)"
              : "rgba(88,28,135,0.3)",
            border: `1px solid ${isSpymasterView ? "rgba(234,179,8,0.5)" : "rgba(139,92,246,0.3)"}`,
            color: isSpymasterView ? "#fde047" : "#a78bfa",
            boxShadow: isSpymasterView
              ? "0 0 15px rgba(234,179,8,0.2)"
              : "none",
          }}
        >
          {isSpymasterView ? "SPYMASTER VIEW" : "OPERATIVE VIEW"}
        </button>
      )}
    </div>
  </div>
);
