import { useParams, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useGameHub } from "../../features/game/hooks/useGameHub";
import type {
  CardDTO,
  RevealedCard,
} from "../../features/game/hooks/useGameHub";
import { useCopyToClipboard } from "usehooks-ts";
import "./room.style.css";
import { useGetGame } from "../../features/game/hooks/useGetGame";
import type { GameSessionDTO } from "../../api/types";

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
  teamColor: "Red" | "Blue" | "Neutral" | "Bomb" | null;
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
  status: "Waiting" | "Playing" | "Ended";
  currentTeam: "Red" | "Blue";
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

const mapGameStatus = (
  apiStatus: GameSessionDTO["status"],
): GameRoom["status"] => {
  switch (apiStatus) {
    case "Active":
      return "Playing";
    case "GameOver":
      return "Ended";
    default:
      return "Waiting";
  }
};

const mapTeam = (
  team: GameSessionDTO["redTeam"] | null | undefined,
  fallbackName: string,
  fallbackColor: string,
): Team => ({
  id: team?.id ?? 0,
  name: team?.name ?? fallbackName,
  color: team?.color ?? fallbackColor,
  score: team?.score ?? 0,
  members: (team?.members ?? []).map((m) => ({
    id: m.id,
    playerName: m.playerName ?? "",
    teamColor: m.teamColor ?? null,
    isMindreader: m.isMindreader,
    isPlaying: m.isPlaying,
  })),
});

const mapToGameRoom = (dto: GameSessionDTO): GameRoom => ({
  code: dto.code,
  status: mapGameStatus(dto.status),
  currentTeam: dto.currentTeam,
  winner: dto.winner ?? null,
  startTime: dto.startTime,
  endTime: dto.endTime ?? null,
  redTeam: mapTeam(dto.redTeam, "Red Team", "Red"),
  blueTeam: mapTeam(dto.blueTeam, "Blue Team", "Blue"),
  players: (dto.players ?? []).map((p) => ({
    id: p.id,
    playerName: p.playerName ?? "",
    teamColor: p.teamColor ?? null,
    isMindreader: p.isMindreader,
    isPlaying: p.isPlaying,
  })),
  board: dto.board
    ? {
        id: dto.board.id,
        size: dto.board.size,
        cards: (dto.board.cards ?? []).map((c) => ({
          word: c.word,
          teamColor: c.teamColor,
          isRevealed: c.isRevealed,
          position: c.position,
        })),
      }
    : { id: 0, size: 25, cards: [] },
});

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
  const { getGame } = useGetGame();

  const [game, setGame] = useState<GameRoom | null>(() => {
    try {
      const stored = localStorage.getItem("game");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Read current username from JWT "username" claim
  const currentUsername = (() => {
    try {
      const token = localStorage.getItem("token") ?? "";
      if (!token) return "";
      const payload = JSON.parse(atob(token.split(".")[1]));
      return String(payload["username"] ?? "");
    } catch {
      return localStorage.getItem("username") ?? "";
    }
  })();

  useEffect(() => {
    if (!roomCode) return;
    const fetchGame = async () => {
      const response = await getGame(roomCode);
      if (!response?.data) return;
      setGame(mapToGameRoom(response.data));
    };
    fetchGame();
  }, []);

  const [isSpymasterView, setIsSpymasterView] = useState(false);
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  // Spymaster hint input
  const [hintWord, setHintWord] = useState("");
  const [hintCount, setHintCount] = useState(1);
  const [hintSending, setHintSending] = useState(false);

  // Track guesses made this turn to enforce wordCount limit
  const [guessesThisTurn, setGuessesThisTurn] = useState(0);

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

  // ── SignalR ─────────────────────────────────────────────────────────────────

  const {
    connStatus,
    logs,
    gameState,
    startGame,
    updateTeam,
    executeGuess,
    giveHint,
  } = useGameHub({
    gameCode: roomCode,

    onPlayerTeamChanged: (playerName, newTeam, isMindreader) => {
      setGame((g) => {
        if (!g) return g;
        let found = false;
        const players = g.players.map((p) => {
          if (p.playerName === playerName) {
            found = true;
            return { ...p, teamColor: newTeam, isMindreader };
          }
          return p;
        });
        if (!found) {
          players.push({
            id: 0,
            playerName,
            teamColor: newTeam,
            isMindreader,
            isPlaying: true,
          });
        }
        return { ...g, players };
      });
    },

    onGameStarted: (firstTeam) => {
      setGame((g) =>
        g
          ? {
              ...g,
              status: "Playing",
              currentTeam: firstTeam as "Red" | "Blue",
            }
          : g,
      );
      setGuessesThisTurn(0);
    },

    onReceiveCards: (cards: CardDTO[]) => {
      setGame((g) => {
        if (!g) return g;
        const mappedCards: CardData[] = cards.map((c) => ({
          word: c.word,
          teamColor: c.teamColor,
          isRevealed: c.isRevealed,
          position: c.position,
        }));
        return { ...g, board: { ...g.board, cards: mappedCards } };
      });
    },

    onGuessExecuted: (revealedCards: RevealedCard[], isGameOver, winner) => {
      setGame((g) => {
        if (!g) return g;
        const cards = g.board.cards.map((c) => {
          const revealed = revealedCards.find((r) => r.position === c.position);
          if (!revealed) return c;
          return {
            ...c,
            isRevealed: true,
            teamColor: revealed.teamColor as CardData["teamColor"],
          };
        });
        return {
          ...g,
          board: { ...g.board, cards },
          status: isGameOver ? "Ended" : g.status,
          winner: winner ?? g.winner,
        };
      });
      setSelectedCard(null);
      setGuessesThisTurn((n) => n + 1);
    },
  });

  // Reset guess counter when a new hint arrives (new turn)
  useEffect(() => {
    setGuessesThisTurn(0);
  }, [gameState.currentHint?.word]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (game) localStorage.setItem("game", JSON.stringify(game));
  }, [game]);

  // ── Derived player role ───────────────────────────────────────────────────

  const myPlayer =
    game?.players.find((p) => p.playerName === currentUsername) ?? null;
  const myTeam = myPlayer?.teamColor ?? null;
  const myIsMindreader = myPlayer?.isMindreader ?? false;
  const isMyTeamsTurn = game?.currentTeam === myTeam;

  // Auto spymaster view
  useEffect(() => {
    if (myIsMindreader && game?.status === "Playing") {
      setIsSpymasterView(true);
    }
  }, [myIsMindreader, game?.status]);

  // Spymaster: my turn = spymaster + my team's turn + no active hint
  const isMyTurnToHint =
    game?.status === "Playing" &&
    myIsMindreader &&
    isMyTeamsTurn &&
    !gameState.currentHint;

  // Operative: my turn = operative + my team's turn + hint exists + guesses left
  // wordCount + 1 bonus guess allowed per Codenames rules
  const guessesAllowed = (gameState.currentHint?.count ?? 0) + 1;
  const guessesRemaining = Math.max(0, guessesAllowed - guessesThisTurn);
  const isMyTurnToGuess =
    game?.status === "Playing" &&
    !myIsMindreader &&
    isMyTeamsTurn &&
    !!gameState.currentHint &&
    guessesRemaining > 0;

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleStartGame = () => {
    if (game?.code) startGame(game.code);
  };

  const handleJoinTeam = async (
    teamColor: "Red" | "Blue",
    isMindreader: boolean,
  ) => {
    if (!game || game.status !== "Waiting" || connStatus !== "Connected")
      return;
    setJoinError(null);

    if (isMindreader) {
      const existingSpymaster = game.players.find(
        (p) => p.teamColor === teamColor && p.isMindreader,
      );
      if (
        existingSpymaster &&
        existingSpymaster.playerName !== currentUsername
      ) {
        setJoinError(
          `${teamColor} already has a Spymaster (${existingSpymaster.playerName})`,
        );
        setTimeout(() => setJoinError(null), 3000);
        return;
      }
    }

    const me = game.players.find((p) => p.playerName === currentUsername);
    if (me && me.teamColor === teamColor && me.isMindreader === isMindreader)
      return;

    try {
      await updateTeam(game.code, teamColor, isMindreader);
    } catch (err) {
      console.error("UpdateTeam failed:", err);
    }
  };

  const handleGiveHint = async () => {
    if (!game || !hintWord.trim() || hintCount < 1 || hintSending) return;
    setHintSending(true);
    try {
      await giveHint(game.code, hintWord.trim(), hintCount);
      setHintWord("");
      setHintCount(1);
    } catch (err) {
      console.error("GiveHint failed:", err);
    } finally {
      setHintSending(false);
    }
  };

  const handleCardClick = async (card: CardData) => {
    if (!isMyTurnToGuess || card.isRevealed || connStatus !== "Connected")
      return;

    if (selectedCard === card.position) {
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

  // ── Derived display ───────────────────────────────────────────────────────

  const redRemaining =
    game?.board.cards.filter((c) => c.teamColor === "Red" && !c.isRevealed)
      .length ?? 0;
  const blueRemaining =
    game?.board.cards.filter((c) => c.teamColor === "Blue" && !c.isRevealed)
      .length ?? 0;

  const canStart = game?.status === "Waiting" && connStatus === "Connected";
  const isRedTurn = game?.currentTeam === "Red";
  const isBlueTurn = game?.currentTeam === "Blue";

  const getTurnLabel = () => {
    if (game?.status !== "Playing") return null;
    if (isMyTurnToHint)
      return <span style={{ color: "#f0abfc" }}>Your turn — give a hint!</span>;
    if (isMyTurnToGuess)
      return (
        <span style={{ color: myTeam === "Red" ? "#f87171" : "#818cf8" }}>
          Your turn — {guessesRemaining} guess
          {guessesRemaining !== 1 ? "es" : ""} left
        </span>
      );
    if (!isMyTeamsTurn)
      return (
        <span style={{ color: "rgba(139,92,246,0.5)" }}>
          Waiting for {game.currentTeam} team...
        </span>
      );
    if (!myIsMindreader && isMyTeamsTurn && !gameState.currentHint)
      return (
        <span style={{ color: "rgba(139,92,246,0.5)" }}>
          Waiting for Spymaster's hint...
        </span>
      );
    if (!myIsMindreader && isMyTeamsTurn && guessesRemaining === 0)
      return (
        <span style={{ color: "rgba(139,92,246,0.4)" }}>
          No more guesses this turn
        </span>
      );
    return null;
  };

  const getCardClass = (card: CardData) => {
    if (!card.isRevealed) {
      const dimmed = !isMyTurnToGuess ? "opacity-60 cursor-not-allowed" : "";
      if (isSpymasterView && card.teamColor) {
        const spymasterBorder: Record<string, string> = {
          Red: "balatro-card-unrevealed !border-red-500/50",
          Blue: "balatro-card-unrevealed !border-blue-500/50",
          Neutral: "balatro-card-unrevealed",
          Bomb: "balatro-card-unrevealed !border-orange-500/50",
        };
        return `${spymasterBorder[card.teamColor] ?? "balatro-card-unrevealed"} ${selectedCard === card.position ? "balatro-card-selected" : ""} ${dimmed}`;
      }
      return `balatro-card-unrevealed ${selectedCard === card.position ? "balatro-card-selected" : ""} ${dimmed}`;
    }
    const revealed: Record<string, string> = {
      Red: "balatro-card-red",
      Blue: "balatro-card-blue",
      Neutral: "balatro-card-neutral",
      Bomb: "balatro-card-bomb",
    };
    return revealed[card.teamColor ?? "Neutral"] ?? "balatro-card-neutral";
  };

  const getCardTextColor = (card: CardData) => {
    if (!card.isRevealed) return "text-violet-100 font-black";
    const colors: Record<string, string> = {
      Red: "text-red-200 font-black",
      Blue: "text-blue-200 font-black",
      Neutral: "text-stone-300 font-bold",
      Bomb: "text-orange-300 font-black",
    };
    return colors[card.teamColor ?? "Neutral"] ?? "text-white font-bold";
  };

  const getSpymasterDot = (teamColor: string | null) => {
    if (!teamColor) return "bg-white/20";
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
      {/* ── Top Bar ─────────────────────────────────────────────────────────── */}
      <div className="balatro-topbar flex items-center justify-between px-6 py-3 relative z-10">
        <div
          className="balatro-title text-3xl cursor-pointer select-none"
          style={{ color: "#c4b5fd" }}
          onClick={() => navigate("/")}
        >
          Mind<span style={{ color: "#818cf8" }}>Link</span>
        </div>
        <div className="flex items-center gap-3">
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
            <div className="absolute top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black text-white text-xs px-2 py-1 rounded pointer-events-none whitespace-nowrap">
              {isCopied ? "Copied!" : "Click to copy"}
            </div>
          </div>

          <span
            className="px-3 py-1 text-xs font-bold rounded-full tracking-widest uppercase"
            style={{
              background:
                game?.status === "Playing"
                  ? "rgba(16,185,129,0.15)"
                  : game?.status === "Ended"
                    ? "rgba(100,116,139,0.15)"
                    : "rgba(99,102,241,0.15)",
              border: `1px solid ${game?.status === "Playing" ? "rgba(52,211,153,0.4)" : game?.status === "Ended" ? "rgba(148,163,184,0.3)" : "rgba(129,140,248,0.4)"}`,
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

          <span
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${statusColors[connStatus] ?? statusColors.Disconnected}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${statusDot[connStatus] ?? statusDot.Disconnected}`}
            />
            {connStatus}
          </span>

          {game?.status === "Playing" && (
            <button
              onClick={() => setIsSpymasterView((s) => !s)}
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

      {/* ── Error Toast ─────────────────────────────────────────────────────── */}
      {joinError && (
        <div
          className="text-center py-2 relative z-10"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(239,68,68,0.15), transparent)",
            borderBottom: "1px solid rgba(239,68,68,0.3)",
          }}
        >
          <span className="text-xs tracking-widest uppercase text-red-400">
            ✗ {joinError}
          </span>
        </div>
      )}

      {/* ── Status / Hint Banner ─────────────────────────────────────────────── */}
      <div className="balatro-hint-banner text-center py-2.5 relative z-10 min-h-[40px] flex items-center justify-center">
        {game?.status === "Waiting" ? (
          <span
            className="text-xs tracking-widest uppercase balatro-turn-pulse"
            style={{ color: "#818cf8" }}
          >
            Choose your team below before the game starts
          </span>
        ) : game?.status === "Playing" ? (
          <span className="text-sm tracking-widest uppercase flex items-center gap-3">
            {gameState.currentHint ? (
              <>
                <span style={{ color: "rgba(167,139,250,0.5)" }}>HINT</span>
                <span
                  className="balatro-title text-xl"
                  style={{
                    color: "#f0abfc",
                    textShadow: "0 0 15px rgba(240,171,252,0.6)",
                  }}
                >
                  {gameState.currentHint.word}
                </span>
                <span style={{ color: "#a78bfa" }}>
                  ×{gameState.currentHint.count}
                </span>
                <span className="text-xs normal-case">{getTurnLabel()}</span>
              </>
            ) : (
              <span className="text-xs normal-case">{getTurnLabel()}</span>
            )}
          </span>
        ) : null}
      </div>

      {/* ── Spymaster Hint Input — only visible to active spymaster ─────────── */}
      {isMyTurnToHint && (
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
            onKeyDown={(e) => e.key === "Enter" && handleGiveHint()}
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

          {/* Count picker */}
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
              style={{
                color: "#f0abfc",
                minWidth: "24px",
                textAlign: "center",
              }}
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
            onClick={handleGiveHint}
            disabled={!hintWord.trim() || hintSending}
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
            {hintSending ? "Sending..." : "Give Hint"}
          </button>
        </div>
      )}

      {/* ── Selected card confirm bar ────────────────────────────────────────── */}
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

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <div
        className="flex flex-1 gap-4 p-4 relative z-10"
        style={{ minHeight: 0 }}
      >
        {/* Blue Team */}
        <BalatroteamPanel
          team={game?.blueTeam ?? null}
          color="blue"
          remaining={blueRemaining}
          isCurrentTurn={isBlueTurn}
          players={game?.players.filter((p) => p.teamColor === "Blue") ?? []}
          currentUsername={currentUsername}
          gameStatus={game?.status ?? "Waiting"}
          onJoin={(isMindreader) => handleJoinTeam("Blue", isMindreader)}
        />

        {/* Board */}
        <div className="flex-1 flex flex-col gap-3" style={{ minWidth: 0 }}>
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

          <div
            className="grid grid-cols-5 gap-2 flex-1"
            style={{ alignContent: "start" }}
          >
            {(game?.board.cards ?? []).map((card) => (
              <button
                key={card.position}
                onClick={() => handleCardClick(card)}
                disabled={card.isRevealed || !isMyTurnToGuess}
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
                {isSpymasterView && !card.isRevealed && card.teamColor && (
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
                onClick={handleStartGame}
                className="balatro-btn balatro-btn-start px-6 py-2.5 text-sm uppercase"
              >
                Start Game
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

        {/* Red Team */}
        <BalatroteamPanel
          team={game?.redTeam ?? null}
          color="red"
          remaining={redRemaining}
          isCurrentTurn={isRedTurn}
          players={game?.players.filter((p) => p.teamColor === "Red") ?? []}
          currentUsername={currentUsername}
          gameStatus={game?.status ?? "Waiting"}
          onJoin={(isMindreader) => handleJoinTeam("Red", isMindreader)}
        />
      </div>

      {/* ── Winner overlay ─────────────────────────────────────────────────── */}
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
              Game Over
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
              Back to Lobby
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
  currentUsername: string;
  gameStatus: "Waiting" | "Playing" | "Ended";
  onJoin: (isMindreader: boolean) => void;
}

const BalatroteamPanel = ({
  team,
  color,
  remaining,
  isCurrentTurn,
  players,
  currentUsername,
  gameStatus,
  onJoin,
}: BalatroteamPanelProps) => {
  const isRed = color === "red";
  const isWaiting = gameStatus === "Waiting";

  const operatives = players.filter((p) => !p.isMindreader);
  const spymasters = players.filter((p) => p.isMindreader);

  const spymasterTakenByOther = spymasters.some(
    (p) => p.playerName !== currentUsername,
  );
  const iAmSpymaster = spymasters.some((p) => p.playerName === currentUsername);
  const iAmOperative = operatives.some((p) => p.playerName === currentUsername);
  const iAmInThisTeam = iAmSpymaster || iAmOperative;

  const accentColor = isRed ? "#f87171" : "#818cf8";
  const dimColor = isRed ? "rgba(252,165,165,0.6)" : "rgba(165,180,252,0.6)";
  const dimColorFaint = isRed
    ? "rgba(252,165,165,0.45)"
    : "rgba(165,180,252,0.45)";
  const bgColor = isRed ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)";
  const borderColor = isRed ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)";

  const playerChip = (p: Player) => (
    <div
      key={p.playerName}
      className="text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"
      style={{
        background:
          p.playerName === currentUsername
            ? isRed
              ? "rgba(239,68,68,0.25)"
              : "rgba(99,102,241,0.25)"
            : bgColor,
        color: accentColor,
        border: `1px solid ${p.playerName === currentUsername ? accentColor : borderColor}`,
        boxShadow:
          p.playerName === currentUsername
            ? `0 0 8px ${isRed ? "rgba(239,68,68,0.3)" : "rgba(99,102,241,0.3)"}`
            : "none",
      }}
    >
      {p.playerName === currentUsername && (
        <span style={{ fontSize: "0.55rem", opacity: 0.7 }}>YOU </span>
      )}
      {p.playerName}
    </div>
  );

  return (
    <div
      className={`w-44 flex flex-col gap-2.5 transition-all duration-500 ${isCurrentTurn ? "opacity-100" : "opacity-40"} ${isCurrentTurn ? (isRed ? "current-turn-glow-red" : "current-turn-glow-blue") : ""}`}
      style={{ borderRadius: "14px" }}
    >
      <div
        className={isRed ? "balatro-panel-red" : "balatro-panel-blue"}
        style={{ padding: "12px", textAlign: "center" }}
      >
        <div
          className="text-xs tracking-[0.2em] uppercase mb-1"
          style={{ color: dimColor, fontFamily: "'Lilita One', cursive" }}
        >
          {isRed ? "♥" : "♠"} {team?.name ?? (isRed ? "Red Team" : "Blue Team")}
        </div>
        <div
          className={`balatro-title ${isRed ? "balatro-glow-red" : "balatro-glow-blue"}`}
          style={{ fontSize: "3.5rem", lineHeight: 1, color: accentColor }}
        >
          {remaining}
        </div>
        <div
          className="text-xs tracking-widest mt-1"
          style={{ color: dimColor, opacity: 0.6 }}
        >
          REMAINING
        </div>
        {isCurrentTurn && (
          <div
            className="mt-2 text-xs tracking-widest uppercase balatro-turn-pulse"
            style={{ color: accentColor, fontFamily: "'Lilita One', cursive" }}
          >
            YOUR TURN
          </div>
        )}
        {isWaiting && iAmInThisTeam && (
          <div
            className="mt-1 text-xs tracking-widest uppercase"
            style={{ color: accentColor, opacity: 0.7 }}
          >
            {iAmSpymaster ? "SPYMASTER" : "OPERATIVE"}
          </div>
        )}
      </div>

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
          style={{ color: dimColorFaint, fontFamily: "'Lilita One', cursive" }}
        >
          Operatives
        </div>
        {operatives.length === 0 ? (
          <div className="text-xs" style={{ color: "rgba(139,92,246,0.3)" }}>
            None yet
          </div>
        ) : (
          operatives.map(playerChip)
        )}
        {isWaiting && !iAmOperative && (
          <button
            onClick={() => onJoin(false)}
            className="balatro-join-btn w-full py-1.5 text-xs uppercase mt-1"
          >
            + Operative
          </button>
        )}
        {isWaiting && iAmSpymaster && (
          <button
            onClick={() => onJoin(false)}
            className="balatro-join-btn w-full py-1.5 text-xs uppercase mt-1"
          >
            Switch to Operative
          </button>
        )}
      </div>

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
          style={{ color: dimColorFaint, fontFamily: "'Lilita One', cursive" }}
        >
          Spymaster
        </div>
        {spymasters.length === 0 ? (
          <div className="text-xs" style={{ color: "rgba(139,92,246,0.3)" }}>
            None yet
          </div>
        ) : (
          spymasters.map(playerChip)
        )}
        {isWaiting && !spymasterTakenByOther && !iAmSpymaster && (
          <button
            onClick={() => onJoin(true)}
            className="balatro-join-btn w-full py-1.5 text-xs uppercase mt-1"
          >
            + Spymaster
          </button>
        )}
        {isWaiting && spymasterTakenByOther && !iAmSpymaster && (
          <div
            className="text-xs text-center py-1 mt-1"
            style={{ color: "rgba(139,92,246,0.35)", fontStyle: "italic" }}
          >
            Slot taken
          </div>
        )}
        {isWaiting && iAmSpymaster && (
          <button
            className="balatro-join-btn w-full py-1.5 text-xs uppercase mt-1"
            style={{ opacity: 0.5, cursor: "default", pointerEvents: "none" }}
          >
            YOUR SLOT
          </button>
        )}
      </div>

      <div
        className={isRed ? "balatro-panel-red" : "balatro-panel-blue"}
        style={{ padding: "10px", textAlign: "center" }}
      >
        <div
          className="text-xs tracking-widest uppercase"
          style={{ color: dimColorFaint, fontFamily: "'Lilita One', cursive" }}
        >
          Score
        </div>
        <div
          className={`balatro-title text-3xl ${isRed ? "balatro-glow-red" : "balatro-glow-blue"}`}
          style={{ color: accentColor }}
        >
          {team?.score ?? 0}
        </div>
      </div>
    </div>
  );
};
