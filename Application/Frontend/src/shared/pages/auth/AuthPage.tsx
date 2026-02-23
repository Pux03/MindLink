import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";
type AuthMode = "login" | "register";

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

    if (mode === "register" && !form.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Invalid email address";
    }
    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (mode === "register" && form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (mode === "register" && form.password !== form.repeatPassword) {
      newErrors.repeatPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    if (mode == "login") {
      const user = await login({
        email: form.email,
        password: form.password,
      });
      console.log(user);
    } else if (mode == "register") {
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

  return (
    <div className="min-h-screen max-w-full bg-[url('/src/assets/loading-2.webp')] bg-cover bg-center text-white flex flex-col">
      <div className="absolute inset-0 bg-black/70"></div>
      {/* Title */}
      <div className="w-full flex justify-center items-center py-12 drop-shadow-lg text-shadow-xs text-shadow-black">
        <h1 className="text-8xl font-extrabold tracking-[.05em] animate-fadeIn">
          Mind<span className="text-blue-400">Link</span>
        </h1>
      </div>

      {/* Container */}
      <div className="relative flex flex-1 items-center justify-center">
        {/* Centered form */}
        <div className="flex flex-col items-center z-10">
          {/* Mode toggle */}
          <div className="flex gap-10 mb-12 animate-fadeIn">
            <button
              onClick={() => switchMode("login")}
              className={`text-4xl font-semibold transition-all duration-300 drop-shadow-lg cursor-pointer ${
                mode === "login"
                  ? "text-blue-400 scale-110"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => switchMode("register")}
              className={`text-4xl font-semibold transition-all duration-300 drop-shadow-lg cursor-pointer ${
                mode === "register"
                  ? "text-green-400 scale-110"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              Register
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-6 w-96 animate-fadeIn">
            {/* Username – register only */}
            <div
              className={`transition-all duration-500 overflow-hidden ${
                mode === "register"
                  ? "max-h-28 opacity-100 translate-y-0"
                  : "max-h-0 opacity-0 -translate-y-4"
              }`}
            >
              <AuthField
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
                error={errors.username}
                accentColor="text-green-400"
              />
            </div>

            {/* Email */}
            <AuthField
              name="email"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              accentColor={
                mode === "register" ? "text-green-400" : "text-blue-400"
              }
            />

            {/* Password */}
            <AuthField
              name="password"
              placeholder="Password"
              type="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              accentColor={
                mode === "register" ? "text-green-400" : "text-blue-400"
              }
            />

            {/* Repeat password – register only */}
            <div
              className={`transition-all duration-500 overflow-hidden ${
                mode === "register"
                  ? "max-h-28 opacity-100 translate-y-0"
                  : "max-h-0 opacity-0 -translate-y-4"
              }`}
            >
              <AuthField
                name="repeatPassword"
                placeholder="Repeat Password"
                type="password"
                value={form.repeatPassword}
                onChange={handleChange}
                error={errors.repeatPassword}
                accentColor="text-green-400"
              />
            </div>

            {/* Submit */}
            <div
              onClick={!loading ? handleSubmit : undefined}
              className={`mt-4 text-5xl font-semibold transition-all duration-300 ease-out drop-shadow-lg w-full
                text-center hover:scale-110 select-none
                ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                ${mode === "register" ? "text-green-400" : "text-blue-400"}`}
            >
              {loading ? "..." : mode === "register" ? "Register" : "Login"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Field component ────────────────────────────────────────────────────────────

interface AuthFieldProps {
  name: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  accentColor: string;
}

const AuthField = ({
  name,
  placeholder,
  type = "text",
  value,
  onChange,
  error,
  accentColor,
}: AuthFieldProps) => (
  <div className="flex flex-col gap-1">
    <div className="relative group">
      {/* Animated left border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 rounded-full transition-all duration-300
          ${value ? accentColor.replace("text-", "bg-") : "bg-white/20"}
          group-focus-within:${accentColor.replace("text-", "bg-")} group-focus-within:shadow-lg`}
      />
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        className={`w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg
          pl-5 pr-4 py-3 text-xl font-medium text-white placeholder-white/30
          focus:outline-none focus:border-white/30 focus:bg-white/10
          transition-all duration-300
          ${error ? "border-red-400/60" : ""}`}
      />
    </div>
    {error && (
      <span className="text-red-400 text-sm pl-1 animate-fadeIn">{error}</span>
    )}
  </div>
);
