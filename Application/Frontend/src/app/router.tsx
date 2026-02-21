import { createBrowserRouter } from "react-router-dom";
import { Layout } from "../shared/layout/Layout";
import { AuthPage } from "../shared/pages/auth/AuthPage";
import { RoomPage } from "../shared/pages/RoomPage";
import { HomePage } from "../shared/pages/HomePage";
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "auth", element: <AuthPage /> },
      { path: "r/:roomCode", element: <RoomPage /> },
    ],
  },
]);
