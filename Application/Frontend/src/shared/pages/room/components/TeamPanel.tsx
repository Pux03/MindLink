import type { Team, Player } from "../types";

interface TeamPanelProps {
  team: Team | null;
  color: "red" | "blue";
  remaining: number;
  isCurrentTurn: boolean;
  players: Player[];
  currentUsername: string;
  gameStatus: "Waiting" | "Playing" | "Ended";
  onJoin: (isMindreader: boolean) => void;
}

const GlowJoinBtn = ({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full py-1.5 text-xs uppercase mt-1 font-bold tracking-widest"
    style={{
      borderRadius: "8px",
      background: disabled
        ? "rgba(20,83,45,0.3)"
        : "linear-gradient(135deg, #14532d 0%, #166534 60%, #15803d 100%)",
      border: "1px solid rgba(74,222,128,0.45)",
      color: disabled ? "rgba(187,247,208,0.35)" : "#bbf7d0",
      boxShadow: disabled
        ? "none"
        : "0 0 10px rgba(74,222,128,0.3), 0 0 20px rgba(74,222,128,0.1), inset 0 1px 0 rgba(74,222,128,0.2)",
      cursor: disabled ? "default" : "pointer",
      transition: "all 0.2s ease",
      pointerEvents: disabled ? "none" : "auto",
    }}
    onMouseEnter={(e) => {
      if (disabled) return;
      const el = e.currentTarget;
      el.style.boxShadow =
        "0 0 18px rgba(74,222,128,0.55), 0 0 35px rgba(74,222,128,0.2), inset 0 1px 0 rgba(74,222,128,0.3)";
      el.style.borderColor = "rgba(74,222,128,0.75)";
      el.style.transform = "translateY(-1px)";
    }}
    onMouseLeave={(e) => {
      if (disabled) return;
      const el = e.currentTarget;
      el.style.boxShadow =
        "0 0 10px rgba(74,222,128,0.3), 0 0 20px rgba(74,222,128,0.1), inset 0 1px 0 rgba(74,222,128,0.2)";
      el.style.borderColor = "rgba(74,222,128,0.45)";
      el.style.transform = "translateY(0)";
    }}
  >
    {label}
  </button>
);

const SlotTaken = () => (
  <div
    className="text-xs text-center py-1 mt-1"
    style={{ color: "rgba(139,92,246,0.35)", fontStyle: "italic" }}
  >
    Slot taken
  </div>
);

const YourSlot = ({ isRed }: { isRed: boolean }) => (
  <div
    className="w-full py-1.5 text-xs uppercase mt-1 font-bold tracking-widest text-center"
    style={{
      borderRadius: "8px",
      background: isRed ? "rgba(239,68,68,0.08)" : "rgba(99,102,241,0.08)",
      border: `1px solid ${isRed ? "rgba(239,68,68,0.25)" : "rgba(99,102,241,0.25)"}`,
      color: isRed ? "rgba(248,113,113,0.45)" : "rgba(129,140,248,0.45)",
    }}
  >
    ✓ Your Slot
  </div>
);

export const TeamPanel = ({
  team,
  color,
  remaining,
  isCurrentTurn,
  players,
  currentUsername,
  gameStatus,
  onJoin,
}: TeamPanelProps) => {
  const isRed = color === "red";
  const isWaiting = gameStatus === "Waiting";

  const operatives = players.filter((p) => !p.isMindreader);
  const spymasters = players.filter((p) => p.isMindreader);

  const iAmOperative = operatives.some((p) => p.playerName === currentUsername);
  const iAmSpymaster = spymasters.some((p) => p.playerName === currentUsername);
  const iAmInThisTeam = iAmOperative || iAmSpymaster;

  // Slot taken = someone else occupies it (max 1 per role)
  const operativeTaken = operatives.some(
    (p) => p.playerName !== currentUsername,
  );
  const spymasterTaken = spymasters.some(
    (p) => p.playerName !== currentUsername,
  );

  const accentColor = isRed ? "#f87171" : "#818cf8";
  const dimColor = isRed ? "rgba(252,165,165,0.6)" : "rgba(165,180,252,0.6)";
  const dimColorFaint = isRed
    ? "rgba(252,165,165,0.45)"
    : "rgba(165,180,252,0.45)";
  const bgColor = isRed ? "rgba(239,68,68,0.1)" : "rgba(99,102,241,0.1)";
  const borderColor = isRed ? "rgba(239,68,68,0.2)" : "rgba(99,102,241,0.2)";
  const panelClass = isRed ? "balatro-panel-red" : "balatro-panel-blue";

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

  // ── Operative slot CTA ─────────────────────────────────────────────────────
  const renderOperativeCTA = () => {
    if (!isWaiting) return null;
    if (iAmOperative) return <YourSlot isRed={isRed} />;
    if (operativeTaken) return <SlotTaken />;
    // slot is free
    if (iAmSpymaster)
      return (
        <GlowJoinBtn
          label="Switch to Operative"
          onClick={() => onJoin(false)}
        />
      );
    return <GlowJoinBtn label="+ Operative" onClick={() => onJoin(false)} />;
  };

  // ── Spymaster slot CTA ─────────────────────────────────────────────────────
  const renderSpymasterCTA = () => {
    if (!isWaiting) return null;
    if (iAmSpymaster) return <YourSlot isRed={isRed} />;
    if (spymasterTaken) return <SlotTaken />;
    if (iAmOperative)
      return (
        <GlowJoinBtn label="Switch to Spymaster" onClick={() => onJoin(true)} />
      );
    return <GlowJoinBtn label="+ Spymaster" onClick={() => onJoin(true)} />;
  };

  return (
    <div
      className={`w-44 flex flex-col gap-2.5 transition-all duration-500 ${
        isCurrentTurn ? "opacity-100" : "opacity-40"
      } ${isCurrentTurn ? (isRed ? "current-turn-glow-red" : "current-turn-glow-blue") : ""}`}
      style={{ borderRadius: "14px" }}
    >
      {/* Header */}
      <div
        className={panelClass}
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

      {/* Operative */}
      <div
        className={panelClass}
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
          Operative
        </div>
        {operatives.length === 0 ? (
          <div className="text-xs" style={{ color: "rgba(139,92,246,0.3)" }}>
            None yet
          </div>
        ) : (
          operatives.map(playerChip)
        )}
        {renderOperativeCTA()}
      </div>

      {/* Spymaster */}
      <div
        className={panelClass}
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
        {renderSpymasterCTA()}
      </div>

      {/* Score
      <div
        className={panelClass}
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
      </div> */}
    </div>
  );
};
