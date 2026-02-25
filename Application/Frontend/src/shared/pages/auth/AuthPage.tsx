import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
import "./auth.page.css";

type AuthMode = "login" | "register";

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
              <BalatroField
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                error={errors.username}
                accentColor={accentColor}
                accentGlow={accentGlow}
                onEnter={handleSubmit}
              />
            </div>

            <BalatroField
              name="email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              accentColor={accentColor}
              accentGlow={accentGlow}
              onEnter={handleSubmit}
            />

            <BalatroField
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              accentColor={accentColor}
              accentGlow={accentGlow}
              onEnter={handleSubmit}
            />

            {/* Repeat password - register only */}
            <div
              className={`transition-all duration-400 overflow-hidden ${mode === "register" ? "max-h-28 opacity-100" : "max-h-0 opacity-0"}`}
            >
              <BalatroField
                name="repeatPassword"
                placeholder="Repeat Password"
                type="password"
                value={form.repeatPassword}
                onChange={handleChange}
                error={errors.repeatPassword}
                accentColor={accentColor}
                accentGlow={accentGlow}
                onEnter={handleSubmit}
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

interface BalatroFieldProps {
  name: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  accentColor: string;
  accentGlow: string;
  onEnter?: () => void;
}

const BalatroField = ({
  name,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  accentColor,
  accentGlow,
  onEnter,
}: BalatroFieldProps) => (
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
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            onEnter();
          }
        }}
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
