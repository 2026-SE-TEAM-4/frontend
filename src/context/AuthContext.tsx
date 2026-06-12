import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { apiFetch, getToken, setToken } from "@/lib/api";
import type { AuthUser, LoginResponse, Me } from "@/types/api";

interface AuthState {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return;
    }
    apiFetch<Me>("/auth/me")
      .then((me) => setUser({ id: me.id, name: me.name, role: me.role, teamId: me.teamId }))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  async function login(email: string, password: string) {
    const res = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(res.accessToken);
    setUser(res.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const value = useContext(Ctx);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
