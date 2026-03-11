import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../shared/layout/Layout";
import { AuthPage } from "../shared/pages/auth/AuthPage";
import { RoomPage } from "../shared/pages/room/RoomPage";
import { HomePage } from "../shared/pages/home/HomePage";
import { NotFoundPage } from "../shared/pages/not_found/NotFoundPage";
import { Protected } from "../shared/layout/Protected";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "auth", element: <AuthPage /> },
      {
        element: <Protected />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "r/:roomCode", element: <RoomPage /> },
        ],
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
