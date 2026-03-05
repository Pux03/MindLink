import type { GameState } from "../../../features/game/hooks/useGameHub";
import type { GameRoom } from "../types";

interface StatusBannerProps {
  game: GameRoom | null;
  gameState: GameState;
  isMyTurnToHint: boolean;
  isMyTurnToGuess: boolean;
  isMyTeamsTurn: boolean;
  myTeam: string | null;
  myIsMindreader: boolean;
  guessesRemaining: number;
}

export const StatusBanner = ({
  game,
  gameState,
  isMyTurnToHint,
  isMyTurnToGuess,
  isMyTeamsTurn,
  myTeam,
  myIsMindreader,
  guessesRemaining,
}: StatusBannerProps) => {
  const turnLabel = (() => {
    if (game?.status !== "Playing") return null;
    if (isMyTurnToHint)
      return <span style={{ color: "#f0abfc" }}>Your turn — give a hint!</span>;
    if (isMyTurnToGuess)
      return (
        <span style={{ color: myTeam === "Red" ? "#f87171" : "#818cf8" }}>
          Your turn — select {guessesRemaining} card
          {guessesRemaining !== 1 ? "s" : ""}
        </span>
      );
    if (!isMyTeamsTurn)
      return (
        <span style={{ color: "rgba(139,92,246,0.5)" }}>
          Waiting for {game?.currentTeam} team...
        </span>
      );
    if (!myIsMindreader && isMyTeamsTurn && !gameState.currentHint)
      return (
        <span style={{ color: "rgba(139,92,246,0.5)" }}>
          Waiting for Spymaster's hint...
        </span>
      );
    return null;
  })();

  return (
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
              <span className="text-xs normal-case">{turnLabel}</span>
            </>
          ) : (
            <span className="text-xs normal-case">{turnLabel}</span>
          )}
        </span>
      ) : null}
    </div>
  );
};
