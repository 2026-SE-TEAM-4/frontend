const BASE = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
const TOKEN_KEY = "sh_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const raw = await res.text();
  const body = raw ? JSON.parse(raw) : null;

  if (!res.ok) {
    const detail = body?.detail ?? body?.message ?? `요청 실패 (${res.status})`;
    throw new ApiError(res.status, typeof detail === "string" ? detail : "요청 실패");
  }
  return body as T;
}

export { BASE as API_BASE };
