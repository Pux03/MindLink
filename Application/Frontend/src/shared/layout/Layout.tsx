import { Outlet } from "react-router-dom";

export const Layout = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-black via-zinc-900 to-black relative overflow-hidden">
      
      {/* Scanlines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:100%_6px] pointer-events-none" />

      {/* Content */}
      <div className="relative w-full min-h-screen text-white">
        <Outlet />
      </div>
    </div>
  );
};
