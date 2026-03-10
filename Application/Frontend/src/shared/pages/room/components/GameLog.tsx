import { useRef, useEffect } from "react";
import type { LogEntry } from "../types";

interface GameLogProps {
  logs: LogEntry[];
  canStart: boolean;
  gameStatus: "Waiting" | "Playing" | "Ended";
  onStartGame: () => void;
  onLeave: () => void;
}

// ── Parse log messages into structured history entries ────────────────────────

interface HistoryEntry {
  id: number;
  kind: "game_start" | "hint" | "guess" | "win" | "join" | "error";
  content: React.ReactNode;
  time: string;
}

const teamColor = (team: string) =>
  team === "Red" ? "#f87171" : team === "Blue" ? "#818cf8" : "#c4b5fd";

const parseEntry = (log: LogEntry): HistoryEntry | null => {
  const msg = log.message.trim();

  // Game started: "Red goes first"
  if (log.type === "success" && msg.includes("goes first")) {
    const team = msg.split(" ")[2];
    return {
      id: log.id,
      kind: "game_start",
      time: log.time,
      content: (
        <div className="flex items-center gap-2">
          <span style={{ color: "rgba(167,139,250,0.5)", fontSize: "0.65rem" }}>
            GAME
          </span>
          <span
            className="font-bold"
            style={{ color: "rgba(196,181,253,0.8)" }}
          >
            Game Started
          </span>
          <span style={{ color: "rgba(139,92,246,0.4)" }}>-</span>
          <span className="font-bold" style={{ color: teamColor(team) }}>
            {team}
          </span>
          <span style={{ color: "rgba(196,181,253,0.5)" }}>goes first</span>
        </div>
      ),
    };
  }

  // Win: "Red team wins!"
  if (log.type === "success" && msg.includes("wins")) {
    const team = msg.split(" ")[0];
    return {
      id: log.id,
      kind: "win",
      time: log.time,
      content: (
        <div className="flex items-center gap-2">
          <span style={{ color: "rgba(167,139,250,0.5)", fontSize: "0.65rem" }}>
            END
          </span>
          <span
            className="font-bold"
            style={{
              color: teamColor(team),
              textShadow: `0 0 10px ${teamColor(team)}`,
            }}
          >
            {team} Team Wins!
          </span>
          <span>🏆</span>
        </div>
      ),
    };
  }

  // Hint: "WORD × N"
  if (log.type === "hint") {
    // Regex sada traži: "username WORD × count"
    const match = msg.match(/^(\S+)\s+(.+)\s×\s(\d+)$/);

    if (match) {
      const [, username, word, count] = match;
      return {
        id: log.id,
        kind: "hint",
        time: log.time,
        content: (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              style={{
                color: "rgba(167,139,250,0.5)",
                fontSize: "0.65rem",
                fontWeight: "bold",
              }}
            >
              HINT
            </span>
            <span
              className="font-bold"
              style={{ color: "rgba(196,181,253,0.8)" }}
            >
              {username}
            </span>
            <span style={{ color: "rgba(139,92,246,0.4)" }}>-</span>

            <span className="font-bold" style={{ color: "#c4b5fd" }}>
              {word}
            </span>
            <span
              className="px-1.5 py-0.5 rounded font-bold"
              style={{
                background: "rgba(240,171,252,0.1)",
                border: "1px solid rgba(240,171,252,0.25)",
                color: "#e879f9",
                fontSize: "0.7rem",
              }}
            >
              ×{count}
            </span>
          </div>
        ),
      };
    }
  }

  // Guess: "username: WORD1, WORD2" or just "WORD1, WORD2"
  if (log.type === "guess") {
    const colonIdx = msg.indexOf(": ");
    const player = colonIdx !== -1 ? msg.slice(0, colonIdx) : null;
    const wordsPart = colonIdx !== -1 ? msg.slice(colonIdx + 2) : msg;
    const words = wordsPart
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);
    return {
      id: log.id,
      kind: "guess",
      time: log.time,
      content: (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span style={{ color: "rgba(167,139,250,0.5)", fontSize: "0.65rem" }}>
            GUESS
          </span>
          {player && (
            <span
              className="font-bold"
              style={{ color: "rgba(196,181,253,0.8)" }}
            >
              {player}
            </span>
          )}
          <span style={{ color: "rgba(139,92,246,0.4)" }}>-</span>

          {words.map((word, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded font-bold uppercase tracking-wide"
              style={{
                background: "rgba(250,204,21,0.1)",
                border: "1px solid rgba(250,204,21,0.25)",
                color: "#fde047",
                fontSize: "0.7rem",
              }}
            >
              {word}
            </span>
          ))}
        </div>
      ),
    };
  }

  // Join: "name → Team Role"
  if (log.type === "info" && msg.includes("→")) {
    const [name, rest] = msg.split("→").map((s) => s.trim());
    const isRed = rest?.includes("Red");
    const isBlue = rest?.includes("Blue");
    const color = isRed ? "#f87171" : isBlue ? "#818cf8" : "#c4b5fd";
    return {
      id: log.id,
      kind: "join",
      time: log.time,
      content: (
        <div className="flex items-center gap-2">
          <span style={{ color: "rgba(167,139,250,0.5)", fontSize: "0.65rem" }}>
            JOIN
          </span>
          <span
            className="font-bold"
            style={{ color: "rgba(196,181,253,0.8)" }}
          >
            {name}
          </span>
          <span style={{ color: "rgba(139,92,246,0.35)" }}>joined</span>
          <span className="font-bold" style={{ color }}>
            {rest}
          </span>
        </div>
      ),
    };
  }

  // Error
  if (log.type === "error") {
    return {
      id: log.id,
      kind: "error",
      time: log.time,
      content: (
        <div className="flex items-center gap-2">
          <span style={{ color: "#f87171", fontSize: "0.65rem" }}>✗</span>
          <span style={{ color: "rgba(252,165,165,0.7)" }}>{msg}</span>
        </div>
      ),
    };
  }

  // Skip technical/noise messages
  return null;
};

const kindBorder: Record<HistoryEntry["kind"], string> = {
  game_start: "rgba(139,92,246,0.35)",
  hint: "rgba(232,121,249,0.3)",
  guess: "rgba(250,204,21,0.25)",
  win: "rgba(52,211,153,0.4)",
  join: "rgba(139,92,246,0.15)",
  error: "rgba(248,113,113,0.2)",
};

const kindBg: Record<HistoryEntry["kind"], string> = {
  game_start: "rgba(139,92,246,0.08)",
  hint: "rgba(217,70,239,0.07)",
  guess: "rgba(245,158,11,0.06)",
  win: "rgba(16,185,129,0.1)",
  join: "transparent",
  error: "rgba(239,68,68,0.07)",
};

// ── Component ─────────────────────────────────────────────────────────────────

export const GameLog = ({
  logs,
  canStart,
  gameStatus,
  onStartGame,
  onLeave,
}: GameLogProps) => {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const entries = logs.map(parseEntry).filter(Boolean) as HistoryEntry[];
  const isPlaying = gameStatus === "Playing" || gameStatus === "Ended";

  return (
    <div className="flex gap-3" style={{ height: "300px" }}>
      {/* History panel */}
      <div className="balatro-log flex-1 overflow-hidden flex flex-col">
        <div
          className="px-3 py-1.5 flex items-center justify-between shrink-0"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{
              color: "rgba(167,139,250,0.5)",
              fontFamily: "'Lilita One', cursive",
            }}
          >
            History
          </span>
          {entries.length > 0 && (
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{
                color: "rgba(139,92,246,0.5)",
                background: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.15)",
              }}
            >
              {entries.length}
            </span>
          )}
        </div>

        <div
          className="flex-1 overflow-y-auto px-2 py-1.5"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(139,92,246,0.25) transparent",
          }}
        >
          {entries.length === 0 && (
            <p
              className="text-center mt-3 text-xs"
              style={{ color: "rgba(139,92,246,0.2)", fontStyle: "italic" }}
            >
              {gameStatus === "Waiting"
                ? "Game hasn't started yet..."
                : "No moves yet..."}
            </p>
          )}

          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between px-2 py-1 rounded-md mb-1"
              style={{
                background: kindBg[entry.kind],
                border: `1px solid ${kindBorder[entry.kind]}`,
              }}
            >
              <div className="flex-1 min-w-0">{entry.content}</div>
              {entry.kind !== "join" && (
                <span
                  className="shrink-0 font-mono ml-2"
                  style={{ color: "rgba(139,92,246,0.25)", fontSize: "0.6rem" }}
                >
                  {entry.time}
                </span>
              )}
            </div>
          ))}

          <div ref={endRef} />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-2 justify-end shrink-0">
        {!isPlaying && (
          <button
            disabled={!canStart}
            onClick={onStartGame}
            className="balatro-btn balatro-btn-start px-6 py-2.5 text-sm uppercase"
          >
            Start Game
          </button>
        )}
        <button
          onClick={onLeave}
          className="balatro-btn balatro-btn-leave px-6 py-2.5 text-sm uppercase"
        >
          Leave
        </button>
      </div>
    </div>
  );
};
