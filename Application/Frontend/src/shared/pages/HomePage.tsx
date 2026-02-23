import { useNavigate } from "react-router-dom";
import { useCreateGame } from "../features/game/hooks/useCreateGame";

const generateGameName = (): string => {
  const words = ["alpha", "bravo", "delta", "cobra", "falcon", "shadow"];
  return `${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}`;
};

export const HomePage = () => {
  const navigate = useNavigate();
  const { createGame, loading } = useCreateGame();

  const handleCreateLobby = async () => {
    const gameName = generateGameName();

    const game = await createGame(); // optional: playerName
    console.log(game);
    if (game) {
      // Navigate to the room page using the generated gameName
      navigate(`/r/${gameName}`);
    }
  };

  return (
    <div className="min-h-screen max-w-full bg-[url('/src/assets/bg.webp')] text-white flex flex-col">
      {/* Title */}
      <div className="w-full flex justify-center items-center py-12 drop-shadow-lg text-shadow-xs text-shadow-black">
        <h1 className="text-8xl font-extrabold animate-fadeIn">
          Mind<span className="text-[#ffe0bd]">Link</span>
        </h1>
      </div>

      {/* Container */}
      <div className="flex flex-row flex-1">
        {/* Left */}
        <div className="w-1/2 lg:p-20 min-[1600px]:p-40">
          <div className="space-y-20 max-h-[70vh] w-full text-6xl font-semibold animate-fadeIn">
            <div
              onClick={handleCreateLobby}
              className="translate-x-5 hover:translate-x-25 hover:scale-120 transition-all duration-300 ease-out cursor-pointer drop-shadow-lg w-full"
            >
              <span className="text-green-400">Create</span> Lobby
            </div>

            <div className="translate-x-20 hover:translate-x-35 hover:scale-120 transition-all duration-300 ease-out cursor-pointer drop-shadow-lg w-full">
              <span className="text-red-400">Join</span> Lobby
            </div>

            <div className="text-orange-300 translate-x-40 hover:translate-x-55 hover:scale-120 transition-all duration-300 ease-out cursor-pointer drop-shadow-lg w-full">
              How To Play
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="w-1/2 flex items-end justify-center overflow-hidden">
          <img
            src="/src/assets/professor.png"
            className="max-h-[70vh] w-auto object-contain -scale-x-100"
          />
        </div>

        <div className="relative w-[300px] h-[120px]">
          <img
            src="/src/assets/card-frame.png"
            alt="Primer"
            className="w-full h-full"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-black text-4xl font-bold"></span>
          </div>
        </div>
      </div>
    </div>
  );
};
