import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

export function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
