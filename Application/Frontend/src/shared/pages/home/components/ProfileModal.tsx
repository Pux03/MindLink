import { useState, useEffect } from "react";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useStats } from "../../../features/profile/hooks/useStats";
import type { StatsDTO, LeaderboardDTO } from "../../../api/types";
import { useNavigate } from "react-router-dom";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getCurrentUser = (): { username: string } => {
  try {
    const userJson = localStorage.getItem("user");
    if (userJson) return JSON.parse(userJson);
  } catch {
    /* noop */
  }
  return { username: "Player" };
};

const StatCard = ({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) => (
  <div
    style={{
      background: "rgba(139,92,246,0.05)",
      border: "1px solid rgba(139,92,246,0.15)",
      borderRadius: "12px",
      padding: "14px",
      textAlign: "center",
    }}
  >
    <div
      style={{
        fontSize: "1.8rem",
        color,
        lineHeight: 1,
        textShadow: `0 0 20px ${color}66`,
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "0.65rem",
        color: "rgba(196,181,253,0.45)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        marginTop: 4,
      }}
    >
      {label}
    </div>
    {sub && (
      <div
        style={{
          fontSize: "0.62rem",
          color: "rgba(139,92,246,0.4)",
          marginTop: 2,
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

const InputField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <label
      style={{
        fontSize: "0.7rem",
        color: "rgba(167,139,250,0.6)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: "rgba(88,28,135,0.2)",
        border: `1px solid ${error ? "rgba(248,113,113,0.5)" : "rgba(139,92,246,0.3)"}`,
        borderRadius: "10px",
        padding: "10px 14px",
        color: "#e2d9f3",
        fontSize: "0.85rem",
        outline: "none",
        transition: "border 0.2s",
        width: "100%",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "rgba(167,139,250,0.6)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = error
          ? "rgba(248,113,113,0.5)"
          : "rgba(139,92,246,0.3)";
      }}
    />
    {error && (
      <span style={{ fontSize: "0.65rem", color: "#f87171" }}>{error}</span>
    )}
  </div>
);

const SaveBtn = ({
  onClick,
  loading,
  disabled,
  success,
}: {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
  success: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      background: success
        ? "linear-gradient(135deg, #14532d, #166534)"
        : disabled
          ? "rgba(88,28,135,0.2)"
          : "linear-gradient(135deg, #5b21b6, #7c3aed)",
      border: `1px solid ${success ? "rgba(74,222,128,0.4)" : disabled ? "rgba(139,92,246,0.15)" : "rgba(167,139,250,0.4)"}`,
      borderRadius: "10px",
      color: success ? "#bbf7d0" : disabled ? "rgba(139,92,246,0.3)" : "white",
      padding: "10px 24px",
      fontSize: "0.75rem",
      fontWeight: 700,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      cursor: disabled || loading ? "not-allowed" : "pointer",
      boxShadow: success
        ? "0 0 16px rgba(74,222,128,0.25)"
        : disabled
          ? "none"
          : "0 0 16px rgba(109,40,217,0.4)",
      transition: "all 0.2s",
      alignSelf: "flex-end",
    }}
  >
    {loading ? "Saving..." : success ? "✓ Saved!" : "Save Changes"}
  </button>
);

const LeaderboardSection = ({
  title,
  icon,
  rows,
  valueLabel,
  color,
  currentUsername,
}: {
  title: string;
  icon: string;
  rows: { username: string; value: number }[];
  valueLabel: string;
  color: string;
  currentUsername: string;
}) => (
  <div
    style={{
      background: "rgba(139,92,246,0.04)",
      border: "1px solid rgba(139,92,246,0.15)",
      borderRadius: "12px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        padding: "10px 14px",
        borderBottom: "1px solid rgba(139,92,246,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: "rgba(139,92,246,0.06)",
      }}
    >
      <span style={{ color, fontSize: "0.85rem" }}>{icon}</span>
      <span
        style={{
          color,
          fontSize: "0.8rem",
          letterSpacing: "0.05em",
        }}
      >
        {title}
      </span>
    </div>
    {rows.length === 0 && (
      <div
        style={{
          padding: "16px",
          textAlign: "center",
          color: "rgba(139,92,246,0.3)",
          fontSize: "0.72rem",
        }}
      >
        No data yet
      </div>
    )}
    {rows.map((row, i) => {
      const isMe = row.username === currentUsername;
      const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
      return (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "9px 14px",
            borderBottom:
              i < rows.length - 1 ? "1px solid rgba(139,92,246,0.07)" : "none",
            background: isMe ? "rgba(139,92,246,0.08)" : "transparent",
          }}
        >
          <div
            style={{
              width: 24,
              flexShrink: 0,
              textAlign: "center",
              fontSize: medal ? "0.9rem" : "0.65rem",
              color: medal ? undefined : "rgba(139,92,246,0.35)",
              fontWeight: 700,
            }}
          >
            {medal ?? `${i + 1}`}
          </div>
          <div
            style={{
              flex: 1,
              fontSize: "0.78rem",
              fontWeight: isMe ? 700 : 400,
              color: isMe ? "#c4b5fd" : "rgba(196,181,253,0.7)",
            }}
          >
            {row.username}
            {isMe && (
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "rgba(139,92,246,0.5)",
                  marginLeft: 6,
                }}
              >
                you
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: "0.95rem",
              color,
              textShadow: `0 0 10px ${color}55`,
            }}
          >
            {row.value}
            <span
              style={{
                fontSize: "0.55rem",
                color: "rgba(139,92,246,0.4)",
                marginLeft: 3,
              }}
            >
              {valueLabel}
            </span>
          </div>
        </div>
      );
    })}
  </div>
);

type Tab = "stats" | "leaderboard" | "username" | "password";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "stats", label: "Stats", icon: "♠" },
  { id: "leaderboard", label: "Board", icon: "♣" },
  { id: "username", label: "Username", icon: "♦" },
  { id: "password", label: "Password", icon: "♥" },
];

export const ProfileModal = ({ isOpen, onClose }: ProfileModalProps) => {
  const navigate = useNavigate();
  const { changeUsername, changePassword, logout } = useAuth();
  const { getStats, getLeaderboard, loading: statsLoading } = useStats();

  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<StatsDTO | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardDTO | null>(null);
  const [leaderboardError, setLeaderboardError] = useState(false);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameSaved, setUsernameSaved] = useState(false);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  const [currentUser, setCurrentUser] = useState(getCurrentUser());

  useEffect(() => {
    if (!isOpen) {
      setTab("stats");
      setNewUsername("");
      setUsernameError("");
      setUsernameSaved(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setPwError("");
      setPwSaved(false);
      setLeaderboardLoaded(false);
      return;
    }
    setCurrentUser(getCurrentUser());
    setStatsError(false);
    getStats().then((res) => {
      if (res?.success) setStats(res.data);
      else setStatsError(true);
    });
  }, [isOpen]);

  useEffect(() => {
    if (tab !== "leaderboard" || leaderboardLoaded) return;
    setLeaderboardError(false);
    getLeaderboard().then((res) => {
      setLeaderboardLoaded(true);
      if (res?.success) setLeaderboard(res.data);
      else setLeaderboardError(true);
    });
  }, [tab]);

  const handleSaveUsername = async () => {
    setUsernameError("");
    if (newUsername.trim().length < 3) {
      setUsernameError("Username must be at least 3 characters");
      return;
    }
    if (newUsername.trim() === currentUser.username) {
      setUsernameError("That's already your username");
      return;
    }
    setUsernameSaving(true);
    const res = await changeUsername(newUsername.trim());
    setUsernameSaving(false);
    if (res?.success) {
      setCurrentUser({ ...currentUser, username: newUsername.trim() });
      setUsernameSaved(true);
      setNewUsername("");
      setTimeout(() => setUsernameSaved(false), 2500);
    } else {
      setUsernameError(res?.message ?? "Failed to change username");
    }
  };

  const handleSavePassword = async () => {
    setPwError("");
    if (newPw.length < 6) {
      setPwError("Password must be at least 6 characters");
      return;
    }
    if (newPw !== confirmPw) {
      setPwError("Passwords don't match");
      return;
    }
    setPwSaving(true);
    const res = await changePassword(currentPw, newPw);
    setPwSaving(false);
    if (res?.success) {
      setPwSaved(true);
      setTimeout(() => {
        onClose();
        logout();
        navigate("/auth");
      }, 1200);
    } else {
      setPwError(res?.message ?? "Failed to change password");
    }
  };

  if (!isOpen) return null;

  const winRate = stats?.winRate ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,2,24,0.92)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background:
            "linear-gradient(160deg, rgba(20,8,52,0.98) 0%, rgba(12,4,32,0.98) 100%)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: "20px",
          boxShadow:
            "0 0 60px rgba(139,92,246,0.15), 0 24px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(139,92,246,0.2)",
          width: "min(520px, 95vw)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.2)",
            borderRadius: "8px",
            color: "rgba(167,139,250,0.6)",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "1rem",
            transition: "all 0.15s",
            zIndex: 1,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "#c4b5fd";
            el.style.borderColor = "rgba(139,92,246,0.5)";
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "rgba(167,139,250,0.6)";
            el.style.borderColor = "rgba(139,92,246,0.2)";
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ padding: "28px 32px 0", textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              margin: "0 auto 12px",
              background:
                "linear-gradient(135deg, rgba(109,40,217,0.4), rgba(139,92,246,0.2))",
              border: "2px solid rgba(139,92,246,0.4)",
              boxShadow: "0 0 20px rgba(139,92,246,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.6rem",
              color: "#c4b5fd",
            }}
          >
            {currentUser.username.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              fontSize: "1.3rem",
              color: "#c4b5fd",
              letterSpacing: "0.05em",
            }}
          >
            {currentUser.username}
          </div>
          <div
            style={{
              fontSize: "0.65rem",
              color: "rgba(139,92,246,0.4)",
              letterSpacing: "0.2em",
              marginTop: 2,
            }}
          >
            ♠ MINDLINK PLAYER ♠
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, padding: "20px 32px 0" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: "8px 4px",
                borderRadius: "10px",
                fontSize: "0.62rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.2s",
                background:
                  tab === t.id ? "rgba(139,92,246,0.18)" : "transparent",
                border: `1px solid ${tab === t.id ? "rgba(139,92,246,0.55)" : "rgba(139,92,246,0.15)"}`,
                color: tab === t.id ? "#c4b5fd" : "rgba(139,92,246,0.4)",
                boxShadow:
                  tab === t.id ? "0 0 12px rgba(139,92,246,0.15)" : "none",
              }}
            >
              <span style={{ marginRight: 3 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        <div
          style={{
            height: 1,
            background: "rgba(139,92,246,0.12)",
            margin: "16px 32px 0",
          }}
        />

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 32px 28px",
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(139,92,246,0.25) transparent",
          }}
        >
          {/* ── Stats ── */}
          {tab === "stats" && (
            <>
              {statsLoading && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "rgba(139,92,246,0.4)",
                    fontSize: "0.8rem",
                  }}
                >
                  Loading stats...
                </div>
              )}
              {!statsLoading && statsError && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#f87171",
                    fontSize: "0.8rem",
                  }}
                >
                  Failed to load stats.
                </div>
              )}
              {!statsLoading && stats && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <StatCard
                      label="Games"
                      value={stats.gamesPlayed}
                      color="#c4b5fd"
                    />
                    <StatCard label="Wins" value={stats.wins} color="#6ee7b7" />
                    <StatCard
                      label="Losses"
                      value={stats.losses}
                      color="#f87171"
                    />
                  </div>
                  <div
                    style={{
                      background: "rgba(139,92,246,0.05)",
                      border: "1px solid rgba(139,92,246,0.15)",
                      borderRadius: 12,
                      padding: 14,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.68rem",
                          color: "rgba(196,181,253,0.5)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                        }}
                      >
                        Win Rate
                      </span>
                      <span
                        style={{
                          color: "#a78bfa",
                          fontSize: "1rem",
                        }}
                      >
                        {winRate}%
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        background: "rgba(139,92,246,0.15)",
                        borderRadius: 3,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${winRate}%`,
                          background:
                            "linear-gradient(90deg, #7c3aed, #a78bfa)",
                          borderRadius: 3,
                          boxShadow: "0 0 8px rgba(167,139,250,0.4)",
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 10,
                    }}
                  >
                    <StatCard
                      label="As Spymaster"
                      value={stats.asSpymaster}
                      sub="games"
                      color="#f0abfc"
                    />
                    <StatCard
                      label="As Operative"
                      value={stats.asOperative}
                      sub="games"
                      color="#818cf8"
                    />
                    <StatCard
                      label="Correct Guesses"
                      value={stats.correctGuesses}
                      color="#6ee7b7"
                    />
                    <StatCard
                      label="Wrong Guesses"
                      value={stats.wrongGuesses}
                      color="#fca5a5"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Leaderboard ── */}
          {tab === "leaderboard" && (
            <>
              {statsLoading && !leaderboardLoaded && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "rgba(139,92,246,0.4)",
                    fontSize: "0.8rem",
                  }}
                >
                  Loading leaderboard...
                </div>
              )}
              {!statsLoading && leaderboardError && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px 0",
                    color: "#f87171",
                    fontSize: "0.8rem",
                  }}
                >
                  Failed to load leaderboard.
                </div>
              )}
              {leaderboardLoaded && leaderboard && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 14 }}
                >
                  <LeaderboardSection
                    title="Most Wins"
                    icon="♠"
                    rows={leaderboard.mostWins}
                    valueLabel="wins"
                    color="#6ee7b7"
                    currentUsername={currentUser.username}
                  />
                  <LeaderboardSection
                    title="Most Correct Guesses"
                    icon="♣"
                    rows={leaderboard.mostCorrectGuesses}
                    valueLabel="guesses"
                    color="#fbbf24"
                    currentUsername={currentUser.username}
                  />
                </div>
              )}
            </>
          )}

          {/* ── Username ── */}
          {tab === "username" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(139,92,246,0.06)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  borderRadius: 10,
                }}
              >
                <span
                  style={{
                    fontSize: "0.65rem",
                    color: "rgba(139,92,246,0.45)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  Current username
                </span>
                <div
                  style={{
                    color: "#c4b5fd",
                    fontSize: "1.1rem",
                    marginTop: 2,
                  }}
                >
                  {currentUser.username}
                </div>
              </div>
              <InputField
                label="New Username"
                value={newUsername}
                onChange={(v) => {
                  setNewUsername(v);
                  setUsernameError("");
                  setUsernameSaved(false);
                }}
                placeholder="Enter new username..."
                error={usernameError}
              />
              <SaveBtn
                onClick={handleSaveUsername}
                loading={usernameSaving}
                disabled={!newUsername.trim()}
                success={usernameSaved}
              />
            </div>
          )}

          {/* ── Password ── */}
          {tab === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(251,191,36,0.05)",
                  border: "1px solid rgba(251,191,36,0.2)",
                  borderRadius: 10,
                  fontSize: "0.7rem",
                  color: "rgba(253,224,71,0.6)",
                }}
              >
                ⚠ Changing your password will log you out.
              </div>
              <InputField
                label="Current Password"
                value={currentPw}
                onChange={(v) => {
                  setCurrentPw(v);
                  setPwError("");
                  setPwSaved(false);
                }}
                type="password"
                placeholder="Enter current password..."
              />
              <InputField
                label="New Password"
                value={newPw}
                onChange={(v) => {
                  setNewPw(v);
                  setPwError("");
                  setPwSaved(false);
                }}
                type="password"
                placeholder="Enter new password..."
                error={pwError}
              />
              <InputField
                label="Confirm New Password"
                value={confirmPw}
                onChange={(v) => {
                  setConfirmPw(v);
                  setPwError("");
                  setPwSaved(false);
                }}
                type="password"
                placeholder="Repeat new password..."
              />
              <SaveBtn
                onClick={handleSavePassword}
                loading={pwSaving}
                disabled={!currentPw || !newPw || !confirmPw}
                success={pwSaved}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
