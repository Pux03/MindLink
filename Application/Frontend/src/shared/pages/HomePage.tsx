import { useNavigate } from "react-router-dom";
import { useCreateGame } from "../features/game/hooks/useCreateGame";
import { useEffect } from "react";

const balatroCss = `

  .home-balatro-root {
    background: #1a0a2e;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }

  .home-balatro-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.07) 2px,
        rgba(0,0,0,0.07) 4px
      );
    pointer-events: none;
    z-index: 9999;
  }

  .home-bg-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 30% 40%, rgba(139,92,246,0.18) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 80%, rgba(99,102,241,0.12) 0%, transparent 55%),
      radial-gradient(ellipse at 10% 90%, rgba(168,85,247,0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  .home-title {
    letter-spacing: 0.03em;
  }

  .home-menu-item {
    letter-spacing: 0.04em;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    cursor: pointer;
    position: relative;
    user-select: none;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .home-menu-item::before {
    content: '♠';
    font-size: 0.5em;
    opacity: 0;
    transition: all 0.25s ease;
  }

  .home-menu-item:hover::before {
    opacity: 0.6;
  }

  .home-menu-item:hover {
    transform: scale(1.07);
    filter: brightness(1.15);
  }

  .home-menu-item:active {
    transform: scale(1.03);
  }

  .home-menu-item-1 { transform: translateX(12px); }
  .home-menu-item-2 { transform: translateX(48px); }
  .home-menu-item-3 { transform: translateX(96px); }

  .home-menu-item-1:hover { transform: translateX(12px) scale(1.07); }
  .home-menu-item-2:hover { transform: translateX(48px) scale(1.07); }
  .home-menu-item-3:hover { transform: translateX(96px) scale(1.07); }

  .home-menu-item.loading-state {
    opacity: 0.5;
    pointer-events: none;
  }

  .home-card-suit {
    position: absolute;
    font-size: 14px;
    opacity: 0.08;
    user-select: none;
    pointer-events: none;
    color: #c4b5fd;
  }

  .home-topbar {
    background: linear-gradient(180deg, rgba(10,4,30,0.9) 0%, transparent 100%);
    pointer-events: none;
  }

  @keyframes home-float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    33% { transform: translateY(-8px) rotate(1deg); }
    66% { transform: translateY(-4px) rotate(-0.5deg); }
  }

  @keyframes home-glow-pulse {
    0%, 100% { text-shadow: 0 0 20px rgba(196,181,253,0.4), 0 0 40px rgba(139,92,246,0.2); }
    50% { text-shadow: 0 0 30px rgba(196,181,253,0.7), 0 0 60px rgba(139,92,246,0.4); }
  }

  .home-title-glow {
    animation: home-glow-pulse 3s ease-in-out infinite;
  }

  .home-prof-float {
    animation: home-float 6s ease-in-out infinite;
    filter: drop-shadow(0 20px 40px rgba(139,92,246,0.3));
  }

  .home-version {
    letter-spacing: 0.2em;
  }

  .home-loading-dots::after {
    content: '';
    animation: dots 1.2s steps(4, end) infinite;
  }
  @keyframes dots {
    0%   { content: ''; }
    25%  { content: '.'; }
    50%  { content: '..'; }
    75%  { content: '...'; }
  }
`;

export const HomePage = () => {
  const navigate = useNavigate();
  const { createGame, loading } = useCreateGame();

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = balatroCss;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleCreateLobby = async () => {
    const game = await createGame();
    console.log(game);
    localStorage.setItem("game", JSON.stringify(game?.data));
    if (game) {
      navigate(`/r/${game.data.code}`);
    }
  };

  // Scattered suit decorations
  const suits = [
    { suit: "♠", top: "12%", left: "5%", size: 28, rot: -15 },
    { suit: "♣", top: "8%", left: "55%", size: 20, rot: 10 },
    { suit: "♦", top: "75%", left: "8%", size: 24, rot: 5 },
    { suit: "♥", top: "60%", left: "48%", size: 18, rot: -8 },
    { suit: "♠", top: "30%", left: "52%", size: 16, rot: 20 },
    { suit: "♣", top: "85%", left: "38%", size: 22, rot: -12 },
  ];

  return (
    <div className="home-balatro-root text-white flex flex-col">
      <div className="home-bg-glow" />

      {/* Scattered suits */}
      {suits.map((s, i) => (
        <span
          key={i}
          className="home-card-suit"
          style={{
            top: s.top,
            left: s.left,
            fontSize: s.size,
            transform: `rotate(${s.rot}deg)`,
            position: "absolute",
            zIndex: 1,
          }}
        >
          {s.suit}
        </span>
      ))}

      {/* Top bar */}
      <div className="home-topbar w-full flex justify-between items-center px-8 py-4 absolute top-0 left-0 z-10">
        <span
          className="home-version text-xs"
          style={{ color: "rgba(139,92,246,0.4)", letterSpacing: "0.25em" }}
        >
          ♠ MINDLINK
        </span>
        <span
          className="home-version text-xs"
          style={{ color: "rgba(139,92,246,0.4)", letterSpacing: "0.25em" }}
        >
          v0.1
        </span>
      </div>

      {/* Title */}
      <div className="w-full flex justify-center items-center pt-16 pb-4 relative z-10">
        <h1
          className="home-title home-title-glow"
          style={{ fontSize: "7rem", lineHeight: 1, color: "#c4b5fd" }}
        >
          Mind<span style={{ color: "#818cf8" }}>Link</span>
        </h1>
      </div>

      {/* Subtitle */}
      <div className="flex justify-center relative z-10 mb-2">
        <span
          className="text-xs tracking-[0.3em] uppercase"
          style={{
            color: "rgba(139,92,246,0.5)",
            fontFamily: "'Lilita One', cursive",
          }}
        >
          ♣ The Mind Reading Game ♦
        </span>
      </div>

      {/* Main content */}
      <div className="flex flex-row flex-1 relative z-10">
        {/* Left — menu */}
        <div className="w-1/2 flex flex-col justify-center lg:px-20 lg:py-10 min-[1600px]:px-40 gap-12">
          {/* Create Lobby */}
          <div
            className={`home-menu-item home-menu-item-1 ${loading ? "loading-state" : ""}`}
            onClick={!loading ? handleCreateLobby : undefined}
            style={{ fontSize: "3.8rem", color: "#86efac" }}
          >
            <span
              style={{
                color: "#4ade80",
                textShadow: "0 0 20px rgba(74,222,128,0.5)",
              }}
            >
              {loading ? (
                <span style={{ fontSize: "0.75em" }}>
                  Creating
                  <span className="home-loading-dots" />
                </span>
              ) : (
                "Create"
              )}
            </span>
            {!loading && <span style={{ color: "#e2e8f0" }}>Lobby</span>}
          </div>

          {/* Join Lobby */}
          <div
            className="home-menu-item home-menu-item-2"
            onClick={() => navigate("/join")}
            style={{ fontSize: "3.8rem", color: "#fca5a5" }}
          >
            <span
              style={{
                color: "#f87171",
                textShadow: "0 0 20px rgba(248,113,113,0.5)",
              }}
            >
              Join
            </span>
            <span style={{ color: "#e2e8f0" }}>Lobby</span>
          </div>

          {/* How To Play */}
          <div
            className="home-menu-item home-menu-item-3"
            style={{ fontSize: "3.8rem", color: "#fde68a" }}
          >
            <span
              style={{
                color: "#fbbf24",
                textShadow: "0 0 20px rgba(251,191,36,0.5)",
              }}
            >
              How To
            </span>
            <span style={{ color: "#e2e8f0" }}>Play</span>
          </div>

          {/* Bottom decorative line */}
          <div
            className="flex items-center gap-3 mt-4 w-full"
            style={{ marginLeft: "12px" }}
          >
            <div
              style={{
                height: "1px",
                width: "33%",
                background:
                  "linear-gradient(90deg, rgba(139,92,246,0.6), transparent)",
              }}
            />
            <span
              style={{
                color: "rgba(139,92,246,0.35)",
                fontSize: "11px",
                letterSpacing: "0.2em",
                fontFamily: "'Lilita One', cursive",
              }}
            >
              ♠ ♣ ♦ ♥
            </span>
            <div
              style={{
                height: "1px",
                width: "33%",
                background:
                  "linear-gradient(90deg, transparent, rgba(139,92,246,0.6))",
              }}
            />
          </div>
        </div>

        {/* Right — professor */}
        <div className="w-1/2 flex items-end justify-center overflow-hidden">
          <img
            src="/src/assets/professor_x.png"
            className="home-prof-float max-h-[70vh] w-auto object-contain -scale-x-100"
          />
        </div>
      </div>
    </div>
  );
};
