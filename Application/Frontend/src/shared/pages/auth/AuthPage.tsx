import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

type AuthMode = "login" | "register";

const balatroCss = `

  .auth-balatro-root {
    background: #1a0a2e;
    min-height: 100vh;
    position: relative;
    overflow: hidden;
  }

  .auth-balatro-root::before {
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

  .auth-bg-glow {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse at 50% 20%, rgba(139,92,246,0.2) 0%, transparent 60%),
      radial-gradient(ellipse at 20% 80%, rgba(99,102,241,0.12) 0%, transparent 55%),
      radial-gradient(ellipse at 85% 70%, rgba(168,85,247,0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  .auth-title {
    letter-spacing: 0.03em;
  }

  @keyframes auth-glow-pulse {
    0%, 100% { text-shadow: 0 0 20px rgba(196,181,253,0.4), 0 0 40px rgba(139,92,246,0.2); }
    50% { text-shadow: 0 0 30px rgba(196,181,253,0.7), 0 0 60px rgba(139,92,246,0.4); }
  }

  .auth-title-glow { animation: auth-glow-pulse 3s ease-in-out infinite; }

  .auth-card-suit {
    position: absolute;
    opacity: 0.07;
    user-select: none;
    pointer-events: none;
    color: #c4b5fd;
  }

  /* Mode toggle buttons */
  .auth-mode-btn {
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
    background: none;
    border: none;
    outline: none;
  }

  .auth-mode-btn.active-login {
    color: #818cf8;
    text-shadow: 0 0 20px rgba(129,140,248,0.6), 0 0 40px rgba(99,102,241,0.3);
    transform: scale(1.1);
  }

  .auth-mode-btn.active-register {
    color: #4ade80;
    text-shadow: 0 0 20px rgba(74,222,128,0.6), 0 0 40px rgba(34,197,94,0.3);
    transform: scale(1.1);
  }

  .auth-mode-btn.inactive {
    color: rgba(196,181,253,0.25);
  }

  .auth-mode-btn.inactive:hover {
    color: rgba(196,181,253,0.55);
  }

  /* Input field */
  .auth-input-wrap {
    position: relative;
    display: flex;
    align-items: center;
  }

  .auth-input {
    width: 100%;
    background: rgba(15, 6, 40, 0.7);
    border: 1px solid rgba(139,92,246,0.25);
    border-radius: 10px;
    padding: 12px 16px 12px 48px;
    font-size: 1.1rem;
    font-weight: 700;
    color: #e9d5ff;
    outline: none;
    transition: all 0.2s ease;
    box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
  }

  .auth-input::placeholder {
    color: rgba(139,92,246,0.35);
    font-weight: 400;
  }

  .auth-input:focus {
    border-color: rgba(139,92,246,0.6);
    background: rgba(20, 8, 55, 0.9);
    box-shadow: 0 0 20px rgba(139,92,246,0.15), inset 0 2px 8px rgba(0,0,0,0.3);
  }

  .auth-input.has-error {
    border-color: rgba(239,68,68,0.5);
    box-shadow: 0 0 15px rgba(239,68,68,0.1), inset 0 2px 8px rgba(0,0,0,0.3);
  }

  .auth-input-icon {
    position: absolute;
    left: 14px;
    font-size: 16px;
    opacity: 0.45;
    pointer-events: none;
    color: #a78bfa;
    z-index: 1;
  }

  .auth-input-accent {
    position: absolute;
    left: 0;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  /* Submit button */
  .auth-submit-btn {
    letter-spacing: 0.1em;
    border-radius: 12px;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    border: none;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    width: 100%;
    padding: 14px;
    font-size: 1.4rem;
  }

  .auth-submit-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, transparent 50%);
    pointer-events: none;
  }

  .auth-submit-btn.login-btn {
    background: linear-gradient(135deg, #4338ca 0%, #4f46e5 50%, #6366f1 100%);
    border: 1px solid rgba(129,140,248,0.5);
    color: white;
    box-shadow: 0 4px 20px rgba(99,102,241,0.5), inset 0 1px 0 rgba(165,180,252,0.3);
  }

  .auth-submit-btn.login-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%);
    box-shadow: 0 0 30px rgba(99,102,241,0.6), 0 4px 20px rgba(99,102,241,0.5);
    transform: translateY(-2px) scale(1.02);
  }

  .auth-submit-btn.register-btn {
    background: linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%);
    border: 1px solid rgba(74,222,128,0.5);
    color: white;
    box-shadow: 0 4px 20px rgba(34,197,94,0.4), inset 0 1px 0 rgba(134,239,172,0.3);
  }

  .auth-submit-btn.register-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #15803d 0%, #22c55e 50%, #4ade80 100%);
    box-shadow: 0 0 30px rgba(74,222,128,0.5), 0 4px 20px rgba(34,197,94,0.4);
    transform: translateY(-2px) scale(1.02);
  }

  .auth-submit-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none !important;
  }

  /* Form container */
  .auth-form-container {
    background: linear-gradient(160deg, rgba(20,8,55,0.85) 0%, rgba(10,4,30,0.9) 100%);
    border: 1px solid rgba(139,92,246,0.2);
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(139,92,246,0.15), 0 0 80px rgba(88,28,135,0.1);
    backdrop-filter: blur(20px);
  }

  .auth-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(139,92,246,0.3), transparent);
  }

  @keyframes auth-field-in {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const fieldIcons: Record<string, string> = {
  username: "♣",
  email: "♦",
  password: "♠",
  repeatPassword: "♠",
};

export const AuthPage = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    repeatPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = balatroCss;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: "" }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (mode === "register" && !form.username.trim())
      newErrors.username = "Username is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = "Invalid email address";
    if (!form.password) newErrors.password = "Password is required";
    else if (mode === "register" && form.password.length < 6)
      newErrors.password = "Min 6 characters";
    if (mode === "register" && form.password !== form.repeatPassword)
      newErrors.repeatPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    if (mode === "login") {
      const user = await login({ email: form.email, password: form.password });
      console.log(user);
    } else {
      const user = await register({
        email: form.email,
        username: form.username,
        password: form.password,
      });
      console.log(user);
    }
    setLoading(false);
    navigate("/");
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrors({});
    setForm({ username: "", email: "", password: "", repeatPassword: "" });
  };

  const isLogin = mode === "login";
  const accentColor = isLogin ? "#818cf8" : "#4ade80";
  const accentGlow = isLogin ? "rgba(129,140,248,0.4)" : "rgba(74,222,128,0.4)";

  const suits = [
    { s: "♠", top: "8%", left: "4%", size: 40, rot: -20 },
    { s: "♥", top: "15%", right: "6%", size: 30, rot: 12 },
    { s: "♦", bottom: "20%", left: "5%", size: 35, rot: 8 },
    { s: "♣", bottom: "10%", right: "5%", size: 28, rot: -10 },
    { s: "♠", top: "45%", left: "2%", size: 20, rot: 15 },
    { s: "♦", top: "35%", right: "3%", size: 18, rot: -5 },
  ];

  return (
    <div className="auth-balatro-root text-white flex flex-col">
      <div className="auth-bg-glow" />

      {/* Suits */}
      {suits.map((s, i) => (
        <span
          key={i}
          className="auth-card-suit"
          style={{
            top: s.top,
            bottom: (s as any).bottom,
            left: s.left,
            right: (s as any).right,
            fontSize: s.size,
            transform: `rotate(${s.rot}deg)`,
            position: "absolute",
            zIndex: 1,
          }}
        >
          {s.s}
        </span>
      ))}

      {/* Title */}
      <div
        className="w-full flex justify-center items-center pt-10 pb-4 relative z-10 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <h1
          className="auth-title auth-title-glow"
          style={{ fontSize: "5rem", lineHeight: 1, color: "#c4b5fd" }}
        >
          Mind<span style={{ color: "#818cf8" }}>Link</span>
        </h1>
      </div>
      <div className="flex justify-center relative z-10 mb-8">
        <span
          className="text-xs tracking-[0.3em] uppercase"
          style={{
            color: "rgba(139,92,246,0.4)",
            fontFamily: "'Lilita One', cursive",
          }}
        >
          ♣ The Mind Reading Game ♦
        </span>
      </div>

      {/* Form container */}
      <div className="flex flex-1 items-center justify-center relative z-10 pb-10">
        <div className="auth-form-container w-full max-w-sm px-8 py-8">
          {/* Mode toggle */}
          <div className="flex justify-center gap-8 mb-8">
            <button
              onClick={() => switchMode("login")}
              className={`auth-mode-btn text-3xl ${mode === "login" ? "active-login" : "inactive"}`}
            >
              ♠ Login
            </button>
            <button
              onClick={() => switchMode("register")}
              className={`auth-mode-btn text-3xl ${mode === "register" ? "active-register" : "inactive"}`}
            >
              ♣ Register
            </button>
          </div>

          <div className="auth-divider mb-7" />

          {/* Fields */}
          <div className="flex flex-col gap-4">
            {/* Username - register only */}
            <div
              className={`transition-all duration-400 overflow-hidden ${mode === "register" ? "max-h-28 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <BalatraField
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                error={errors.username}
                accentColor={accentColor}
                accentGlow={accentGlow}
              />
            </div>

            <BalatraField
              name="email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              accentColor={accentColor}
              accentGlow={accentGlow}
            />

            <BalatraField
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              accentColor={accentColor}
              accentGlow={accentGlow}
            />

            {/* Repeat password - register only */}
            <div
              className={`transition-all duration-400 overflow-hidden ${mode === "register" ? "max-h-28 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <BalatraField
                name="repeatPassword"
                placeholder="Repeat Password"
                type="password"
                value={form.repeatPassword}
                onChange={handleChange}
                error={errors.repeatPassword}
                accentColor={accentColor}
                accentGlow={accentGlow}
              />
            </div>

            {/* Submit */}
            <div className="mt-2">
              <button
                onClick={!loading ? handleSubmit : undefined}
                disabled={loading}
                className={`auth-submit-btn ${isLogin ? "login-btn" : "register-btn"}`}
              >
                {loading ? "♦ ..." : isLogin ? "♠ Login" : "♣ Register"}
              </button>
            </div>

            {/* Switch mode hint */}
            <div className="text-center mt-1">
              <span
                onClick={() => switchMode(isLogin ? "register" : "login")}
                className="text-xs cursor-pointer transition-all duration-200"
                style={{
                  color: "rgba(139,92,246,0.4)",
                  fontFamily: "'Lilita One', cursive",
                  letterSpacing: "0.05em",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "rgba(167,139,250,0.7)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(139,92,246,0.4)")
                }
              >
                {isLogin
                  ? "No account? Register →"
                  : "Have an account? Login →"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Balatro Field ─────────────────────────────────────────────────────────────

interface BalatraFieldProps {
  name: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  accentColor: string;
  accentGlow: string;
}

const BalatraField = ({
  name,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  accentColor,
  accentGlow,
}: BalatraFieldProps) => (
  <div className="flex flex-col gap-1">
    <div className="auth-input-wrap">
      {/* Accent left bar */}
      <div
        className="auth-input-accent"
        style={{
          background: value
            ? `linear-gradient(180deg, ${accentColor}, transparent)`
            : "rgba(139,92,246,0.2)",
          boxShadow: value ? `0 0 8px ${accentGlow}` : "none",
        }}
      />
      {/* Suit icon */}
      <span className="auth-input-icon">{fieldIcons[name] ?? "♦"}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        className={`auth-input ${error ? "has-error" : ""}`}
        style={
          value && !error
            ? {
                borderColor: `${accentColor}55`,
                boxShadow: `0 0 15px ${accentGlow}22`,
              }
            : {}
        }
      />
    </div>
    {error && (
      <span
        className="text-xs pl-2"
        style={{
          color: "#f87171",
          fontFamily: "'Lilita One', cursive",
          letterSpacing: "0.03em",
        }}
      >
        ✗ {error}
      </span>
    )}
  </div>
);
