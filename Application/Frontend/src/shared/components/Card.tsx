interface CardProps {
  text: string;
  teamColor?: "Red" | "Blue" | "Neutral" | "Bomb";
  isRevealed?: boolean;
  isSelected?: boolean;
  onClick?: () => void;
}

export const Card = ({
  text,
  teamColor = "Neutral",
  isRevealed = false,
  isSelected = false,
  onClick,
}: CardProps) => {
  // Overlay boja kada je karta otkrivena
  const revealedOverlay: Record<string, string> = {
    Red: "bg-red-600/80",
    Blue: "bg-blue-600/80",
    Neutral: "bg-zinc-500/80",
    Bomb: "bg-gray-900/90",
  };

  return (
    <div
      onClick={onClick}
      className={`
        scale-90
        relative w-[300px] h-[120px] select-none
        transition-all duration-200 ease-out
        ${!isRevealed && onClick ? "cursor-pointer" : ""}
        ${isRevealed ? "opacity-75" : ""}
        ${
          isSelected
            ? "scale-105 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]"
            : !isRevealed && onClick
              ? "hover:scale-102 hover:drop-shadow-lg"
              : ""
        }
      `}
    >
      {/* Card frame image */}
      <img
        src="/src/assets/card-frame.png"
        alt={text}
        className="w-full h-full"
      />

      {/* Revealed color overlay */}
      {isRevealed && (
        <div
          className={`absolute inset-0 rounded-lg ${revealedOverlay[teamColor]} transition-all duration-300`}
        />
      )}

      {/* Selected glow border */}
      {isSelected && !isRevealed && (
        <div className="absolute inset-0 rounded-lg border-2 border-yellow-400 shadow-[inset_0_0_8px_rgba(250,204,21,0.4)]" />
      )}

      {/* Bomb icon */}
      {isRevealed && teamColor === "Bomb" && (
        <div className="absolute inset-0 flex items-center justify-center text-4xl">
          💥
        </div>
      )}

      {/* Word */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`
            text-5xl tracking-wide transition-colors duration-200
            ${isRevealed ? "text-white drop-shadow-md" : "text-black"}
            ${isSelected ? "text-yellow-900" : ""}
          `}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
