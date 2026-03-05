import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useGameHub } from "../../features/game/hooks/useGameHub";
import type {
  CardDTO,
  RevealedCard,
} from "../../features/game/hooks/useGameHub";
import { useCopyToClipboard } from "usehooks-ts";
import "./room.style.css";
import { useGetGame } from "../../features/game/hooks/useGetGame";
import type { GameSessionDTO } from "../../api/types";

import type { GameRoom, CardData, Team } from "./types";
import { TopBar } from "./components/TopBar";
import { StatusBanner } from "./components/StatusBanner";
import { HintInput } from "./components/HintInput";
import { GuessBar } from "./components/GuessBar";
import { GameBoard } from "./components/GameBoard";
import { GameLog } from "./components/GameLog";
import { TeamPanel } from "./components/TeamPanel";
import { WinnerOverlay } from "./components/WinnerOverlay";

// ─── Mappers ──────────────────────────────────────────────────────────────────

const mapGameStatus = (s: GameSessionDTO["status"]): GameRoom["status"] => {
  if (s === "Active") return "Playing";
  if (s === "GameOver") return "Ended";
  return "Waiting";
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

// ─── Component ────────────────────────────────────────────────────────────────

export const RoomPage = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { getGame } = useGetGame();

  // ── State ─────────────────────────────────────────────────────────────────

  const [game, setGame] = useState<GameRoom | null>(() => {
    try {
      const stored = localStorage.getItem("game");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isSpymasterView, setIsSpymasterView] = useState(false);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // ── Current user ──────────────────────────────────────────────────────────

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

  // ── Initial fetch ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!roomCode) return;
    getGame(roomCode).then((res) => {
      if (res?.data) setGame(mapToGameRoom(res.data));
    });
  }, []);

  // ── SignalR ───────────────────────────────────────────────────────────────

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
        if (!found)
          players.push({
            id: 0,
            playerName,
            teamColor: newTeam,
            isMindreader,
            isPlaying: true,
          });
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
      setSelectedCards([]);
    },

    onReceiveCards: (cards: CardDTO[]) => {
      const teamColorMap: Record<number, CardData["teamColor"]> = {
        0: "Red",
        1: "Blue",
        2: "Neutral",
        3: "Bomb",
      };
      const resolveColor = (tc: unknown): CardData["teamColor"] => {
        if (typeof tc === "number") return teamColorMap[tc] ?? null;
        if (
          typeof tc === "string" &&
          ["Red", "Blue", "Neutral", "Bomb"].includes(tc)
        )
          return tc as CardData["teamColor"];
        return null;
      };
      setGame((g) => {
        if (!g) return g;
        const mappedCards: CardData[] = cards.map((c) => ({
          word: c.word,
          teamColor: resolveColor(c.teamColor),
          isRevealed: c.isRevealed,
          position: c.position,
        }));
        return { ...g, board: { ...g.board, cards: mappedCards } };
      });
    },

    onGuessExecuted: (
      revealedCards: RevealedCard[],
      isGameOver,
      winner,
      currentTeam,
    ) => {
      setGame((g) => {
        if (!g) return g;

        // Map numeric TeamColor enum to string (backend may serialize as int via RabbitMQ)
        const teamColorMap: Record<number, CardData["teamColor"]> = {
          0: "Red",
          1: "Blue",
          2: "Neutral",
          3: "Bomb",
        };
        const resolveTeamColor = (tc: unknown): CardData["teamColor"] => {
          if (typeof tc === "number") return teamColorMap[tc] ?? null;
          if (
            typeof tc === "string" &&
            tc in { Red: 1, Blue: 1, Neutral: 1, Bomb: 1 }
          )
            return tc as CardData["teamColor"];
          return null;
        };

        // Merge revealed card data into board.
        // For operatives: before guess their card had teamColor=null.
        // After guess, backend sends real teamColor in RevealedCard — apply it.
        const cards = g.board.cards.map((c) => {
          const revealed = revealedCards.find((r) => r.position === c.position);
          if (!revealed) return c;
          return {
            ...c,
            isRevealed: true,
            teamColor: resolveTeamColor(revealed.teamColor),
          };
        });

        return {
          ...g,
          board: { ...g.board, cards },
          status: isGameOver ? "Ended" : g.status,
          winner: winner ?? g.winner,
          currentTeam: (currentTeam as "Red" | "Blue") ?? g.currentTeam,
        };
      });

      // Turn is over after guess is submitted — clear selections
      setSelectedCards([]);
    },
  });

  // ── Side effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (game) localStorage.setItem("game", JSON.stringify(game));
  }, [game]);

  // Auto-enable spymaster view when I am spymaster
  const myPlayer =
    game?.players.find((p) => p.playerName === currentUsername) ?? null;
  const myIsMindreader = myPlayer?.isMindreader ?? false;
  useEffect(() => {
    if (myIsMindreader && game?.status === "Playing") setIsSpymasterView(true);
  }, [myIsMindreader, game?.status]);

  // Clear selections when hint changes (new turn started)
  useEffect(() => {
    setSelectedCards([]);
  }, [gameState.currentHint?.word, game?.currentTeam]);

  // ── Derived ───────────────────────────────────────────────────────────────

  const myTeam = myPlayer?.teamColor ?? null;
  const isMyTeamsTurn = game?.currentTeam === myTeam;

  const isMyTurnToHint =
    game?.status === "Playing" &&
    myIsMindreader &&
    isMyTeamsTurn &&
    !gameState.currentHint;

  // Operative can select exactly wordCount cards, then confirm once
  const wordCount = gameState.currentHint?.count ?? 0;
  const isMyTurnToGuess =
    game?.status === "Playing" &&
    !myIsMindreader &&
    isMyTeamsTurn &&
    !!gameState.currentHint;

  const redRemaining =
    game?.board.cards.filter((c) => c.teamColor === "Red" && !c.isRevealed)
      .length ?? 0;
  const blueRemaining =
    game?.board.cards.filter((c) => c.teamColor === "Blue" && !c.isRevealed)
      .length ?? 0;
  const canStart = game?.status === "Waiting" && connStatus === "Connected";

  // ── Actions ───────────────────────────────────────────────────────────────

  const [, copy] = useCopyToClipboard();
  const handleCopy = async () => {
    const code = game?.code ?? roomCode;
    if (!code) return;
    await copy(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
    if (me?.teamColor === teamColor && me?.isMindreader === isMindreader)
      return;

    await updateTeam(game.code, teamColor, isMindreader).catch(console.error);
  };

  const handleCardClick = (card: CardData) => {
    if (!isMyTurnToGuess || card.isRevealed) return;
    setSelectedCards((prev) => {
      if (prev.includes(card.position))
        return prev.filter((p) => p !== card.position);
      if (prev.length >= wordCount) return prev; // can't select more than wordCount
      return [...prev, card.position];
    });
  };

  const handleConfirmGuess = async () => {
    if (!game || selectedCards.length === 0 || connStatus !== "Connected")
      return;
    await executeGuess(game.code, selectedCards).catch(console.error);
    setSelectedCards([]);
  };

  const handleGiveHint = async (word: string, count: number) => {
    if (!game) return;
    await giveHint(game.code, word, count).catch(console.error);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="balatro-root text-white flex flex-col"
      style={{ position: "relative", zIndex: 1 }}
    >
      <TopBar
        game={game}
        roomCode={roomCode}
        connStatus={connStatus}
        isCopied={isCopied}
        isSpymasterView={isSpymasterView}
        onCopy={handleCopy}
        onToggleSpymasterView={() => setIsSpymasterView((s) => !s)}
        onNavigateHome={() => navigate("/")}
      />

      {/* Error toast */}
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

      <StatusBanner
        game={game}
        gameState={gameState}
        isMyTurnToHint={isMyTurnToHint}
        isMyTurnToGuess={isMyTurnToGuess}
        isMyTeamsTurn={isMyTeamsTurn}
        myTeam={myTeam}
        myIsMindreader={myIsMindreader}
        guessesRemaining={wordCount - selectedCards.length}
      />

      {isMyTurnToHint && <HintInput onGiveHint={handleGiveHint} />}

      {isMyTurnToGuess && (
        <GuessBar
          selectedCards={selectedCards}
          wordCount={wordCount}
          onConfirm={handleConfirmGuess}
        />
      )}

      {/* Main layout */}
      <div
        className="flex flex-1 gap-4 p-4 relative z-10"
        style={{ minHeight: 0 }}
      >
        <TeamPanel
          team={game?.blueTeam ?? null}
          color="blue"
          remaining={blueRemaining}
          isCurrentTurn={game?.currentTeam === "Blue"}
          players={game?.players.filter((p) => p.teamColor === "Blue") ?? []}
          currentUsername={currentUsername}
          gameStatus={game?.status ?? "Waiting"}
          onJoin={(isMindreader) => handleJoinTeam("Blue", isMindreader)}
        />

        <div className="flex-1 flex flex-col gap-3" style={{ minWidth: 0 }}>
          <GameBoard
            cards={game?.board.cards ?? []}
            selectedCards={selectedCards}
            isMyTurnToGuess={isMyTurnToGuess}
            isSpymasterView={isSpymasterView}
            blueRemaining={blueRemaining}
            redRemaining={redRemaining}
            onCardClick={handleCardClick}
          />

          <GameLog
            logs={logs as any}
            canStart={canStart}
            onStartGame={() => game?.code && startGame(game.code)}
            onLeave={() => navigate(-1)}
          />
        </div>

        <TeamPanel
          team={game?.redTeam ?? null}
          color="red"
          remaining={redRemaining}
          isCurrentTurn={game?.currentTeam === "Red"}
          players={game?.players.filter((p) => p.teamColor === "Red") ?? []}
          currentUsername={currentUsername}
          gameStatus={game?.status ?? "Waiting"}
          onJoin={(isMindreader) => handleJoinTeam("Red", isMindreader)}
        />
      </div>

      {gameState.ended && (
        <WinnerOverlay
          winner={gameState.winner}
          onNavigateHome={() => navigate("/")}
        />
      )}
    </div>
  );
};
