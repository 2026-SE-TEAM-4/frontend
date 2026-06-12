import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/api";

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return roles.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />;
}
