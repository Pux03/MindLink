import { useNavigate } from "react-router-dom";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        background:
          "linear-gradient(160deg, rgba(20,8,52,1) 0%, rgba(12,4,32,1) 100%)",
      }}
    >
      <div
        style={{
          color: "rgba(139,92,246,0.4)",
          fontSize: "0.65rem",
          letterSpacing: "0.35em",
          marginBottom: 12,
        }}
      >
        ♠ ♣ ♦ ♥
      </div>
      <div
        style={{
          fontSize: "6rem",
          color: "#c4b5fd",
          textShadow: "0 0 60px rgba(139,92,246,0.4)",
          lineHeight: 1,
        }}
      >
        404
      </div>
      <div
        style={{
          color: "rgba(196,181,253,0.5)",
          fontSize: "0.85rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          margin: "12px 0 32px",
        }}
      >
        Page not found
      </div>
      <button
        onClick={() => navigate("/")}
        style={{
          background: "linear-gradient(135deg, #5b21b6, #7c3aed)",
          border: "1px solid rgba(167,139,250,0.4)",
          borderRadius: "10px",
          color: "white",
          padding: "10px 28px",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          cursor: "pointer",
          boxShadow: "0 0 20px rgba(109,40,217,0.4)",
        }}
      >
        ← Back to Home
      </button>
    </div>
  );
};
