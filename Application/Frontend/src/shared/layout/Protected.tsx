import { Navigate, Outlet } from "react-router-dom";

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

export const Protected = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};
