import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useGameHub } from "../../features/game/hooks/useGameHub";
import { useCopyToClipboard } from "usehooks-ts";
import "./room.style.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
  id: number;
  playerName: string;
  teamColor: string | null;
  isMindreader: boolean;
  isPlaying: boolean;
}

interface Team {
  id: number;
  name: string;
  color: string;
  score: number;
  members: Player[];
}

interface CardData {
  word: string;
  teamColor: "Red" | "Blue" | "Neutral" | "Bomb";
  isRevealed: boolean;
  position: number;
}

interface Board {
  id: number;
  size: number;
  cards: CardData[];
}

interface GameRoom {
  code: string;
  // Backend GameStatus enum: Waiting = 0, Active = 1, GameOver = 2
  // We map these to UI strings on join via REST; SignalR keeps it in sync.
  status: "Waiting" | "Playing" | "Ended";
  // TeamColor enum: Red = 0, Blue = 1 (adjust if your enum differs)
  currentTeam: number;
  winner: string | null;
  startTime: string;
  endTime: string | null;
  redTeam: Team;
  blueTeam: Team;
  players: Player[];
  board: Board;
}

type LogEntry = {
  id: number;
  type: "info" | "success" | "error" | "hint" | "guess";
  message: string;
  time: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export const RoomPage = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();

  const [game, setGame] = useState<GameRoom | null>(() => {
    try {
      const stored = localStorage.getItem("game");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isSpymaster, setIsSpymaster] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const [, copy] = useCopyToClipboard();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async (textToCopy?: string) => {
    if (!textToCopy) return;
    const result = await copy(textToCopy);
    if (result) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const logsEndRef = useRef<HTMLDivElement | null>(null);

  // ── SignalR hook ────────────────────────────────────────────────────────────
  //
  // Key changes vs original:
  //  - onCardRevealed replaced with onGuessResult (positions[]) because the
  //    backend only sends GuessResult to Clients.Caller, not to the group.
  //    A future backend fix (broadcast CardRevealed to group) would let all
  //    players see the reveal; for now we optimistically reveal for the guesser.
  //  - currentTeam comparison uses 0 = Red, 1 = Blue matching TeamColor enum.
  //
  const { connStatus, logs, gameState, startGame, executeGuess, giveHint } =
    useGameHub({
      gameCode: roomCode,

      // GuessResult is Caller-only from backend — reveals card(s) for the guesser
      onGuessResult: (positions) => {
        setGame((g) => {
          if (!g) return g;
          const cards = g.board.cards.map((c) =>
            positions.includes(c.position) ? { ...c, isRevealed: true } : c,
          );
          return { ...g, board: { ...g.board, cards } };
        });
        setSelectedCard(null);
      },

      onPlayersUpdated: (updater) => {
        setGame((g) => (g ? { ...g, players: updater(g.players) } : g));
      },

      onGameStatusChange: (status) => {
        setGame((g) => (g ? { ...g, status } : g));
      },

      onWinner: (winner) => {
        setGame((g) => (g ? { ...g, winner } : g));
      },
    });

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (game) localStorage.setItem("game", JSON.stringify(game));
  }, [game]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleStartGame = () => {
    if (game?.code) startGame(game.code);
  };

  const handleCardClick = async (card: CardData) => {
    if (card.isRevealed) return;
    if (connStatus !== "Connected") return;

    if (selectedCard === card.position) {
      // Second click = confirm guess
      try {
        await executeGuess(game!.code, card.position);
        setSelectedCard(null);
      } catch (err) {
        console.error("Guess failed:", err);
      }
    } else {
      setSelectedCard(card.position);
    }
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const redRemaining =
    game?.board.cards.filter((c) => c.teamColor === "Red" && !c.isRevealed)
      .length ?? 0;
  const blueRemaining =
    game?.board.cards.filter((c) => c.teamColor === "Blue" && !c.isRevealed)
      .length ?? 0;

  const canStart = game?.status === "Waiting" && connStatus === "Connected";

  // TeamColor enum: Red = 0, Blue = 1
  const isRedTurn = game?.currentTeam === 0;
  const isBlueTurn = game?.currentTeam === 1;

  const getCardClass = (card: CardData) => {
    if (!card.isRevealed) {
      if (isSpymaster) {
        const spymasterBorder: Record<string, string> = {
          Red: "balatro-card-unrevealed !border-red-500/50",
          Blue: "balatro-card-unrevealed !border-blue-500/50",
          Neutral: "balatro-card-unrevealed",
          Bomb: "balatro-card-unrevealed !border-orange-500/50",
        };
        return `${spymasterBorder[card.teamColor]} ${selectedCard === card.position ? "balatro-card-selected" : ""}`;
      }
      return `balatro-card-unrevealed ${selectedCard === card.position ? "balatro-card-selected" : ""}`;
    }
    const revealed: Record<string, string> = {
      Red: "balatro-card-red",
      Blue: "balatro-card-blue",
      Neutral: "balatro-card-neutral",
      Bomb: "balatro-card-bomb",
    };
    return revealed[card.teamColor] ?? "balatro-card-neutral";
  };

  const getCardTextColor = (card: CardData) => {
    if (!card.isRevealed) return "text-violet-100 font-black";
    const colors: Record<string, string> = {
      Red: "text-red-200 font-black",
      Blue: "text-blue-200 font-black",
      Neutral: "text-stone-300 font-bold",
      Bomb: "text-orange-300 font-black",
    };
    return colors[card.teamColor] ?? "text-white font-bold";
  };

  const getSpymasterDot = (teamColor: string) => {
    const dots: Record<string, string> = {
      Red: "bg-red-500 shadow-[0_0_6px_#ef4444]",
      Blue: "bg-blue-500 shadow-[0_0_6px_#3b82f6]",
      Neutral: "bg-stone-400",
      Bomb: "bg-orange-400 shadow-[0_0_6px_#fb923c]",
    };
    return dots[teamColor] ?? "bg-white/30";
  };

  return (
    <div
      className="balatro-root text-white flex flex-col"
      style={{ position: "relative", zIndex: 1 }}
    >
      {/* ── Top Bar ──────────────────────────────────────────────────────────── */}
      <div className="balatro-topbar flex items-center justify-between px-6 py-3 relative z-10">
        <div
          className="balatro-title text-3xl cursor-pointer select-none"
          style={{ color: "#c4b5fd" }}
          onClick={() => navigate("/")}
        >
          Mind<span style={{ color: "#818cf8" }}>Link</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Room code */}
          <div className="relative group inline-block">
            <div
              className="px-4 py-1.5 rounded-lg text-sm tracking-widest cursor-pointer"
              onClick={() => handleCopy(game?.code ?? roomCode)}
              style={{
                background: "rgba(88,28,135,0.3)",
                border: "1px solid rgba(139,92,246,0.4)",
                color: "#c4b5fd",
                letterSpacing: "0.15em",
              }}
            >
              {isCopied ? "COPIED!" : (game?.code ?? roomCode)}
            </div>
            <div
              className="
                absolute top-8 left-1/2 -translate-x-1/2
                opacity-0 group-hover:opacity-100
                transition-opacity duration-200
                bg-black text-white text-xs px-2 py-1 rounded
                pointer-events-none whitespace-nowrap
              "
            >
              {isCopied ? "Copied!" : "Click to copy"}
            </div>
          </div>

          {/* Game status */}
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

          {/* Spymaster toggle */}
          <button
            onClick={() => setIsSpymaster((s) => !s)}
            className="px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all duration-200"
            style={{
              borderRadius: "8px",
              background: isSpymaster
                ? "rgba(234,179,8,0.15)"
                : "rgba(88,28,135,0.3)",
              border: `1px solid ${isSpymaster ? "rgba(234,179,8,0.5)" : "rgba(139,92,246,0.3)"}`,
              color: isSpymaster ? "#fde047" : "#a78bfa",
              boxShadow: isSpymaster ? "0 0 15px rgba(234,179,8,0.2)" : "none",
            }}
          >
            {isSpymaster ? "👁 SPYMASTER" : "🎭 OPERATIVE"}
          </button>
        </div>
      </div>

      {/* ── Hint / Status Banner ─────────────────────────────────────────────── */}
      {gameState.currentHint ? (
        <div className="balatro-hint-banner text-center py-2.5 relative z-10">
          <span
            className="text-sm tracking-widest uppercase"
            style={{ color: "#c4b5fd" }}
          >
            ♦ Hint:{" "}
            <span
              className="balatro-title text-xl"
              style={{
                color: "#f0abfc",
                textShadow: "0 0 15px rgba(240,171,252,0.6)",
              }}
            >
              {gameState.currentHint.word}
            </span>
            <span className="ml-3" style={{ color: "#a78bfa" }}>
              × {gameState.currentHint.count}
            </span>
          </span>
        </div>
      ) : game?.status === "Waiting" ? (
        <div className="balatro-hint-banner text-center py-2 relative z-10">
          <span
            className="text-xs tracking-widest uppercase balatro-turn-pulse"
            style={{ color: "#818cf8" }}
          >
            ♣ Waiting for players to join…
          </span>
        </div>
      ) : null}

      {/* ── Selected card confirm bar ─────────────────────────────────────────── */}
      {selectedCard !== null && (
        <div
          className="text-center py-2 relative z-10"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(250,204,21,0.15), transparent)",
            borderBottom: "1px solid rgba(250,204,21,0.3)",
          }}
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: "#fde047" }}
          >
            ♠ Card selected — click again to confirm guess
          </span>
        </div>
      )}

      {/* ── Main layout ──────────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 gap-4 p-4 relative z-10"
        style={{ minHeight: 0 }}
      >
        {/* ── Blue Team ──────────────────────────────────────────────────────── */}
        <BalatroteamPanel
          team={game?.blueTeam ?? null}
          color="blue"
          remaining={blueRemaining}
          isCurrentTurn={isBlueTurn}
          players={game?.players.filter((p) => p.teamColor === "Blue") ?? []}
        />

        {/* ── Board ──────────────────────────────────────────────────────────── */}
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

          {/* Cards grid */}
          <div
            className="grid grid-cols-5 gap-2 flex-1"
            style={{ alignContent: "start" }}
          >
            {(game?.board.cards ?? []).map((card) => (
              <button
                key={card.position}
                onClick={() => handleCardClick(card)}
                disabled={card.isRevealed}
                className={`${getCardClass(card)} relative flex items-center justify-center p-3`}
                style={{ minHeight: "72px", outline: "none" }}
              >
                {!card.isRevealed && (
                  <>
                    <span
                      className="suit-decoration"
                      style={{ top: 4, left: 6 }}
                    >
                      ♠
                    </span>
                    <span
                      className="suit-decoration"
                      style={{
                        bottom: 4,
                        right: 6,
                        transform: "rotate(180deg)",
                      }}
                    >
                      ♠
                    </span>
                  </>
                )}
                {isSpymaster && !card.isRevealed && (
                  <span
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getSpymasterDot(card.teamColor)}`}
                  />
                )}
                {card.isRevealed && card.teamColor === "Bomb" && (
                  <span className="text-2xl mr-1">💥</span>
                )}
                <span
                  className={`text-sm tracking-wider uppercase ${getCardTextColor(card)}`}
                  style={{ fontSize: "0.8rem" }}
                >
                  {card.word}
                </span>
              </button>
            ))}
          </div>

          {/* Bottom bar: log + actions */}
          <div className="flex gap-3" style={{ height: "140px" }}>
            {/* Game log */}
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
                  ♣ Game Log
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
                    No events yet…
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

            {/* Actions */}
            <div className="flex flex-col gap-2 justify-end">
              <button
                disabled={!canStart}
                onClick={handleStartGame}
                className="balatro-btn balatro-btn-start px-6 py-2.5 text-sm uppercase"
              >
                ♠ Start Game
              </button>
              <button
                onClick={() => navigate(-1)}
                className="balatro-btn balatro-btn-leave px-6 py-2.5 text-sm uppercase"
              >
                Leave
              </button>
            </div>
          </div>
        </div>

        {/* ── Red Team ───────────────────────────────────────────────────────── */}
        <BalatroteamPanel
          team={game?.redTeam ?? null}
          color="red"
          remaining={redRemaining}
          isCurrentTurn={isRedTurn}
          players={game?.players.filter((p) => p.teamColor === "Red") ?? []}
        />
      </div>

      {/* ── Winner overlay ───────────────────────────────────────────────────── */}
      {gameState.ended && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{
            background: "rgba(10,2,30,0.92)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="text-center space-y-8">
            <div
              className="text-xs tracking-[0.4em] uppercase mb-2"
              style={{ color: "rgba(139,92,246,0.6)" }}
            >
              ♠ ♣ Game Over ♦ ♥
            </div>
            <div
              className="balatro-title"
              style={{
                fontSize: "6rem",
                lineHeight: 1,
                color:
                  gameState.winner === "Red"
                    ? "#f87171"
                    : gameState.winner === "Blue"
                      ? "#818cf8"
                      : "#c4b5fd",
                textShadow:
                  gameState.winner === "Red"
                    ? "0 0 40px rgba(239,68,68,0.6), 0 0 80px rgba(239,68,68,0.3)"
                    : "0 0 40px rgba(99,102,241,0.6), 0 0 80px rgba(99,102,241,0.3)",
              }}
            >
              {gameState.winner ?? "No Winner"}
            </div>
            {gameState.winner && (
              <div
                className="balatro-title text-3xl"
                style={{ color: "rgba(196,181,253,0.7)" }}
              >
                Wins the Round!
              </div>
            )}
            <button
              onClick={() => navigate("/")}
              className="balatro-btn balatro-btn-start px-10 py-3 text-base uppercase"
            >
              ♠ Back to Lobby
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Balatro Team Panel ───────────────────────────────────────────────────────

interface BalatroteamPanelProps {
  team: Team | null;
  color: "red" | "blue";
  remaining: number;
  isCurrentTurn: boolean;
  players: Player[];
}

const BalatroteamPanel = ({
  team,
  color,
  remaining,
  isCurrentTurn,
  players,
}: BalatroteamPanelProps) => {
  const isRed = color === "red";

  return (
    <div
      className={`w-44 flex flex-col gap-2.5 transition-all duration-500 ${isCurrentTurn ? "opacity-100" : "opacity-40"} ${isCurrentTurn ? (isRed ? "current-turn-glow-red" : "current-turn-glow-blue") : ""}`}
      style={{ borderRadius: "14px" }}
    >
      {/* Score header */}
      <div
        className={isRed ? "balatro-panel-red" : "balatro-panel-blue"}
        style={{ padding: "12px", textAlign: "center" }}
      >
        <div
          className="text-xs tracking-[0.2em] uppercase mb-1"
          style={{
            color: isRed ? "rgba(252,165,165,0.6)" : "rgba(165,180,252,0.6)",
            fontFamily: "'Lilita One', cursive",
          }}
        >
          {isRed ? "♥" : "♠"} {team?.name ?? (isRed ? "Red Team" : "Blue Team")}
        </div>
        <div
          className={`balatro-title ${isRed ? "balatro-glow-red" : "balatro-glow-blue"}`}
          style={{
            fontSize: "3.5rem",
            lineHeight: 1,
            color: isRed ? "#f87171" : "#818cf8",
          }}
        >
          {remaining}
        </div>
        <div
          className="text-xs tracking-widest mt-1"
          style={{
            color: isRed ? "rgba(252,165,165,0.4)" : "rgba(165,180,252,0.4)",
          }}
        >
          REMAINING
        </div>
        {isCurrentTurn && (
          <div
            className="mt-2 text-xs tracking-widest uppercase balatro-turn-pulse"
            style={{
              color: isRed ? "#fca5a5" : "#a5b4fc",
              fontFamily: "'Lilita One', cursive",
            }}
          >
            ● YOUR TURN
          </div>
        )}
      </div>

      {/* Operatives */}
      <div
        className={isRed ? "balatro-panel-red" : "balatro-panel-blue"}
        style={{
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div
          className="text-xs tracking-[0.15em] uppercase"
          style={{
            color: isRed ? "rgba(252,165,165,0.45)" : "rgba(165,180,252,0.45)",
            fontFamily: "'Lilita One', cursive",
          }}
        >
          Operatives
        </div>
        {players.filter((p) => !p.isMindreader).length === 0 ? (
          <div className="text-xs" style={{ color: "rgba(139,92,246,0.3)" }}>
            None yet
          </div>
        ) : (
          players
            .filter((p) => !p.isMindreader)
            .map((p) => (
              <div
                key={p.id}
                className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{
                  background: isRed
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(99,102,241,0.1)",
                  color: isRed ? "#fca5a5" : "#a5b4fc",
                  border: `1px solid ${isRed ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)"}`,
                }}
              >
                {p.playerName}
              </div>
            ))
        )}
        <button className="balatro-join-btn w-full py-1.5 text-xs uppercase mt-1">
          Join
        </button>
      </div>

      {/* Spymasters */}
      <div
        className={isRed ? "balatro-panel-red" : "balatro-panel-blue"}
        style={{
          padding: "10px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <div
          className="text-xs tracking-[0.15em] uppercase"
          style={{
            color: isRed ? "rgba(252,165,165,0.45)" : "rgba(165,180,252,0.45)",
            fontFamily: "'Lilita One', cursive",
          }}
        >
          Spymasters
        </div>
        {players.filter((p) => p.isMindreader).length === 0 ? (
          <div className="text-xs" style={{ color: "rgba(139,92,246,0.3)" }}>
            None yet
          </div>
        ) : (
          players
            .filter((p) => p.isMindreader)
            .map((p) => (
              <div
                key={p.id}
                className="text-xs font-bold px-2 py-1 rounded-lg"
                style={{
                  background: isRed
                    ? "rgba(239,68,68,0.1)"
                    : "rgba(99,102,241,0.1)",
                  color: isRed ? "#fca5a5" : "#a5b4fc",
                  border: `1px solid ${isRed ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)"}`,
                }}
              >
                {p.playerName}
              </div>
            ))
        )}
        <button className="balatro-join-btn w-full py-1.5 text-xs uppercase mt-1">
          Join
        </button>
      </div>

      {/* Score */}
      <div
        className={isRed ? "balatro-panel-red" : "balatro-panel-blue"}
        style={{ padding: "10px", textAlign: "center" }}
      >
        <div
          className="text-xs tracking-widest uppercase"
          style={{
            color: isRed ? "rgba(252,165,165,0.4)" : "rgba(165,180,252,0.4)",
            fontFamily: "'Lilita One', cursive",
          }}
        >
          Score
        </div>
        <div
          className={`balatro-title text-3xl ${isRed ? "balatro-glow-red" : "balatro-glow-blue"}`}
          style={{ color: isRed ? "#f87171" : "#818cf8" }}
        >
          {team?.score ?? 0}
        </div>
      </div>
    </div>
  );
};
