import { useNavigate } from "react-router-dom";
import { useCreateGame } from "../../features/game/hooks/useCreateGame";
import { useEffect, useState } from "react";
import { JoinLobby } from "../../components/JoinLobby";
import { useAuth } from "../../features/auth/hooks/useAuth";
import "./home.page.css";

export const HomePage = () => {
  const navigate = useNavigate();
  const { createGame, loading } = useCreateGame();
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const { logout } = useAuth();

  const handleCreateLobby = async () => {
    const game = await createGame();
    console.log(game);
    if (game) {
      navigate(`/r/${game.data.code}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

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

        <div className="flex items-center gap-6">
          <span
            className="home-version text-xs"
            style={{ color: "rgba(139,92,246,0.4)", letterSpacing: "0.25em" }}
          >
            v0.1
          </span>

          <button
            onClick={handleLogout}
            className="home-logout-btn text-xs px-4 py-2"
          >
            LOGOUT
          </button>
        </div>
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

          {/* Join Lobby — opens modal */}
          <div
            className="home-menu-item home-menu-item-2"
            onClick={() => setJoinModalOpen(true)}
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

      {/* Join Lobby Modal */}
      <JoinLobby
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </div>
  );
};
