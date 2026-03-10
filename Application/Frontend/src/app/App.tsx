import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import "./App.css";
import { useRef, useEffect } from "react";
import musicFile from "../assets/balatro.mp3";

function App() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const player = audioRef.current;

    const handleFirstInteraction = () => {
      if (player) {
        player.volume = 0.02;
        player.play().catch((err) => console.log("Autoplay blocked", err));
      }
      window.removeEventListener("click", handleFirstInteraction);
    };

    window.addEventListener("click", handleFirstInteraction);
    return () => window.removeEventListener("click", handleFirstInteraction);
  }, []);

  return (
    <div>
      <audio ref={audioRef} src={musicFile} loop preload="auto" />
      <RouterProvider router={router} />
    </div>
  );
}

export default App;
