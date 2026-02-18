import { useNavigate } from "react-router-dom";
import { useState } from "react";

const generateRoomCode = (): string => {
  const words = ["alpha", "bravo", "delta", "cobra", "falcon", "shadow"];
  return `${words[Math.floor(Math.random() * words.length)]}-${words[Math.floor(Math.random() * words.length)]}`;
};

export const HomePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCreateLobby = () => {
    setLoading(true);

    setTimeout(() => {
      const code = generateRoomCode();
      navigate(`/r/${code}`);
    }, 300);
  };

  return (
    <div className="min-h-screen max-w-full bg-[url('/src/assets/bg-homepage.webp')] text-white flex flex-col">
      {/* Title */}
      <div className="w-full flex justify-center items-center py-12 drop-shadow-lg text-shadow-xs text-shadow-black">
        <h1 className="text-8xl font-extrabold tracking-tight animate-fadeIn">
          Mind<span className="text-blue-400 ">Link</span>
        </h1>
      </div>
      {/* Container */}
      <div className="flex flex-row flex-1">
        {/* Left */}
        <div className="w-1/2 lg:p-20 min-[1600px]:p-40">
          {/* Menu */}
          <div className="space-y-20 w-full text-6xl font-semibold animate-fadeIn">
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
            src="/src/assets/professor_x.png"
            className="max-h-[70vh] w-auto object-contain -scale-x-100"
          />
        </div>
      </div>
    </div>
  );
};
