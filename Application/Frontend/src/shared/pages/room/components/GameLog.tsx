import { useRef, useEffect } from "react";
import type { LogEntry } from "../types";

const logTypeIcon: Record<LogEntry["type"], string> = {
  success: "♠",
  error: "✗",
  hint: "♦",
  guess: "♣",
  info: "·",
};
const logTypeColor: Record<LogEntry["type"], string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  hint: "text-fuchsia-400",
  guess: "text-yellow-400",
  info: "text-indigo-400",
};

interface GameLogProps {
  logs: LogEntry[];
  canStart: boolean;
  onStartGame: () => void;
  onLeave: () => void;
}

export const GameLog = ({
  logs,
  canStart,
  onStartGame,
  onLeave,
}: GameLogProps) => {
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="flex gap-3" style={{ height: "140px" }}>
      <div className="balatro-log flex-1 overflow-hidden flex flex-col">
        <div
          className="px-3 py-1.5 flex items-center justify-between"
          style={{ borderBottom: "1px solid rgba(139,92,246,0.15)" }}
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{
              color: "rgba(167,139,250,0.5)",
              fontFamily: "'Lilita One', cursive",
            }}
          >
            Game Log
          </span>
          <span
            className="text-xs font-mono"
            style={{ color: "rgba(139,92,246,0.4)" }}
          >
            {logs.length}
          </span>
        </div>
        <div
          className="flex-1 overflow-y-auto p-2 space-y-0.5"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(139,92,246,0.3) transparent",
          }}
        >
          {logs.length === 0 && (
            <p
              className="text-center mt-3 text-xs"
              style={{ color: "rgba(139,92,246,0.3)" }}
            >
              No events yet...
            </p>
          )}
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 text-xs font-mono px-1 py-0.5"
            >
              <span
                style={{ color: "rgba(139,92,246,0.35)" }}
                className="shrink-0"
              >
                {log.time}
              </span>
              <span className={`shrink-0 ${logTypeColor[log.type]}`}>
                {logTypeIcon[log.type]}
              </span>
              <span style={{ color: "rgba(196,181,253,0.6)" }}>
                {log.message}
              </span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

      <div className="flex flex-col gap-2 justify-end">
        <button
          disabled={!canStart}
          onClick={onStartGame}
          className="balatro-btn balatro-btn-start px-6 py-2.5 text-sm uppercase"
        >
          Start Game
        </button>
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
