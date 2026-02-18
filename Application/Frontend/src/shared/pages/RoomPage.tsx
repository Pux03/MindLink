import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import * as signalR from "@microsoft/signalr";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
}

interface Room {
  code: string;
  gameSessionId: number;
  players: Player[];
  status: "waiting" | "playing" | "ended";
}

interface GameCreatedPayload {
  gameId: number;
  gameName: string;
}

interface GameStartedPayload {
  firstTeam: string;
}

interface GuessExecutedPayload {
  cardWord: string;
  cardTeam: string;
  isCorrect: boolean;
  index: number;
}

interface HintGivenPayload {
  word: string;
  wordCount: number;
}

interface GameEndedPayload {
  winner: string | null;
}

type LogEntry = {
  id: number;
  type: "info" | "success" | "error" | "hint" | "guess";
  message: string;
  time: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = () =>
  new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

let logIdCounter = 0;
const mkLog = (type: LogEntry["type"], message: string): LogEntry => ({
  id: ++logIdCounter,
  type,
  message,
  time: now(),
});

// ─── Connection status badge ───────────────────────────────────────────────────

const HUB_URL = "/hubs/game"; // adjust to your actual hub URL

const statusColors: Record<string, string> = {
  Connected: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  Connecting: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Reconnecting: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  Disconnected: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const statusDot: Record<string, string> = {
  Connected: "bg-emerald-400",
  Connecting: "bg-amber-400 animate-pulse",
  Reconnecting: "bg-amber-400 animate-pulse",
  Disconnected: "bg-red-400",
};

// ─── Component ────────────────────────────────────────────────────────────────

export const RoomPage = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connStatus, setConnStatus] = useState<string>("Disconnected");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [gameState, setGameState] = useState<{
    started: boolean;
    firstTeam?: string;
    currentHint?: { word: string; count: number };
    lastGuess?: GuessExecutedPayload;
    winner?: string | null;
    ended: boolean;
  }>({ started: false, ended: false });

  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  const addLog = useCallback((type: LogEntry["type"], message: string) => {
    setLogs((prev) => [...prev.slice(-49), mkLog(type, message)]);
  }, []);

  // ── Scroll log to bottom ────────────────────────────────────────────────────
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // ── Fetch room from REST ────────────────────────────────────────────────────
  // useEffect(() => {
  //   const fetchRoom = async () => {
  //     try {
  //       const res = await fetch(`/api/rooms/${roomCode}`);
  //       if (!res.ok) throw new Error("Room not found");
  //       const data: Room = await res.json();
  //       setRoom(data);
  //     } catch {
  //       setError("Room does not exist.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchRoom();
  // }, [roomCode]);

  // ── SignalR connection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!room) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connectionRef.current = connection;

    // ── Connection lifecycle ──────────────────────────────────────────────────
    connection.onreconnecting(() => {
      setConnStatus("Reconnecting");
      addLog("error", "Connection lost — reconnecting…");
    });

    connection.onreconnected(async () => {
      setConnStatus("Connected");
      addLog("info", "Reconnected to hub");
      // Rejoin the game group after reconnect
      if (room.gameSessionId) {
        await connection.invoke("JoinGame", room.gameSessionId).catch(() => {});
      }
    });

    connection.onclose(() => {
      setConnStatus("Disconnected");
      addLog("error", "Disconnected from hub");
    });

    // ── Hub event handlers ────────────────────────────────────────────────────

    // game.created → broadcast to All
    connection.on("GameCreated", (payload: GameCreatedPayload) => {
      addLog(
        "info",
        `Game "${payload.gameName}" created (ID: ${payload.gameId})`,
      );
    });

    // game.started → Group only
    connection.on("GameStarted", (payload: GameStartedPayload) => {
      setGameState((s) => ({
        ...s,
        started: true,
        firstTeam: payload.firstTeam,
      }));
      addLog("success", `Game started! First turn: ${payload.firstTeam}`);
      setRoom((r) => (r ? { ...r, status: "playing" } : r));
    });

    // game.guess_executed → Group only
    connection.on("GuessExecuted", (payload: GuessExecutedPayload) => {
      setGameState((s) => ({ ...s, lastGuess: payload }));
      const result = payload.isCorrect ? "✓ Correct" : "✗ Wrong";
      addLog(
        payload.isCorrect ? "success" : "error",
        `${result} — "${payload.cardWord}" (${payload.cardTeam}, card #${payload.index})`,
      );
    });

    // game.hint_given → Group only
    connection.on("HintGiven", (payload: HintGivenPayload) => {
      setGameState((s) => ({
        ...s,
        currentHint: { word: payload.word, count: payload.wordCount },
      }));
      addLog("hint", `Hint: "${payload.word}" × ${payload.wordCount}`);
    });

    // game.ended → Group only
    connection.on("GameEnded", (payload: GameEndedPayload) => {
      setGameState((s) => ({ ...s, ended: true, winner: payload.winner }));
      addLog(
        "success",
        payload.winner
          ? `Game over! Winner: ${payload.winner}`
          : "Game over — no winner",
      );
      setRoom((r) => (r ? { ...r, status: "ended" } : r));
    });

    // ── Start and join game group ─────────────────────────────────────────────
    const start = async () => {
      try {
        setConnStatus("Connecting");
        await connection.start();
        setConnStatus("Connected");
        addLog("info", "Connected to SignalR hub");

        // Ask the hub to add this client to game_{gameSessionId} group
        await connection.invoke("JoinGame", room.gameSessionId);
        addLog("info", `Joined game group for session ${room.gameSessionId}`);
      } catch (err) {
        setConnStatus("Disconnected");
        addLog("error", `Failed to connect: ${String(err)}`);
      }
    };

    start();

    return () => {
      connection.stop();
    };
  }, [room?.gameSessionId, addLog]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start game action ───────────────────────────────────────────────────────
  const handleStartGame = async () => {
    if (!room || !connectionRef.current) return;
    try {
      await connectionRef.current.invoke("StartGame", room.gameSessionId);
    } catch {
      addLog("error", "Failed to start game via hub");
    }
  };

  // ── Render guards ───────────────────────────────────────────────────────────
  // if (loading)
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center space-y-3">
  //         <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
  //         <p className="text-slate-400 text-sm tracking-widest uppercase">
  //           Loading room…
  //         </p>
  //       </div>
  //     </div>
  //   );

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-400 text-lg">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="text-slate-400 text-sm underline underline-offset-4 hover:text-white transition"
          >
            Go back
          </button>
        </div>
      </div>
    );

  const canStart = room?.status === "waiting" && connStatus === "Connected";

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-8 flex flex-col gap-6 font-sans">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Room <span className="text-indigo-400 font-mono">{room?.code}</span>
          </h1>
          {/* Status pill */}
          <span
            className={`px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${
              room?.status === "playing"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : room?.status === "ended"
                  ? "bg-slate-600/40 text-slate-400 border border-slate-600"
                  : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
            }`}
          >
            {room?.status}
          </span>
        </div>

        {/* SignalR connection badge */}
        <span
          className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full ${statusColors[connStatus] ?? statusColors.Disconnected}`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${statusDot[connStatus] ?? statusDot.Disconnected}`}
          />
          {connStatus}
        </span>
      </div>

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column – players + game state */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Players card */}
          <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Players
            </h2>
            <div className="flex flex-col gap-2">
              {room?.players.length === 0 && (
                <p className="text-slate-500 text-sm">No players yet</p>
              )}
              {room?.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-slate-700/50 rounded-lg px-4 py-2.5"
                >
                  <span className="text-sm text-white font-medium">
                    {player.name}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live game state card */}
          {gameState.started && (
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50 flex flex-col gap-3">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                Live State
              </h2>

              {gameState.firstTeam && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">First team</span>
                  <span className="text-white font-semibold">
                    {gameState.firstTeam}
                  </span>
                </div>
              )}

              {gameState.currentHint && (
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-3">
                  <p className="text-xs text-amber-400 uppercase tracking-widest mb-1">
                    Current hint
                  </p>
                  <p className="text-white font-bold text-lg">
                    {gameState.currentHint.word}
                    <span className="ml-2 text-amber-400 font-normal text-sm">
                      × {gameState.currentHint.count}
                    </span>
                  </p>
                </div>
              )}

              {gameState.lastGuess && (
                <div
                  className={`rounded-xl p-3 border ${
                    gameState.lastGuess.isCorrect
                      ? "bg-emerald-500/10 border-emerald-500/25"
                      : "bg-red-500/10 border-red-500/25"
                  }`}
                >
                  <p
                    className={`text-xs uppercase tracking-widest mb-1 ${
                      gameState.lastGuess.isCorrect
                        ? "text-emerald-400"
                        : "text-red-400"
                    }`}
                  >
                    Last guess
                  </p>
                  <p className="text-white font-semibold">
                    {gameState.lastGuess.cardWord}
                    <span className="ml-2 text-slate-400 font-normal text-xs">
                      {gameState.lastGuess.cardTeam} · #
                      {gameState.lastGuess.index}
                    </span>
                  </p>
                </div>
              )}

              {gameState.ended && (
                <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3 text-center">
                  <p className="text-xs text-indigo-400 uppercase tracking-widest mb-1">
                    Game over
                  </p>
                  <p className="text-white font-bold text-lg">
                    {gameState.winner ?? "No winner"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column – event log */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
              Event Log
            </h2>
            <span className="text-xs text-slate-500">
              {logs.length} event{logs.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-1.5 min-h-[280px] max-h-[400px] scrollbar-thin scrollbar-thumb-slate-600">
            {logs.length === 0 && (
              <p className="text-slate-600 text-sm text-center mt-8">
                Waiting for events…
              </p>
            )}
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 text-sm font-mono rounded-lg px-3 py-2 bg-slate-700/30"
              >
                <span className="text-slate-600 shrink-0 text-xs mt-0.5">
                  {log.time}
                </span>
                <span
                  className={`shrink-0 mt-0.5 ${
                    log.type === "success"
                      ? "text-emerald-400"
                      : log.type === "error"
                        ? "text-red-400"
                        : log.type === "hint"
                          ? "text-amber-400"
                          : log.type === "guess"
                            ? "text-sky-400"
                            : "text-slate-400"
                  }`}
                >
                  {log.type === "success"
                    ? "✓"
                    : log.type === "error"
                      ? "✗"
                      : log.type === "hint"
                        ? "💡"
                        : log.type === "guess"
                          ? "🎯"
                          : "·"}
                </span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>

      {/* ── Footer actions ──────────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition"
        >
          Leave
        </button>
        <button
          disabled={!canStart}
          onClick={handleStartGame}
          className="px-6 py-2 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Start Game
        </button>
      </div>
    </div>
  );
};
