# 프론트엔드 연동 — 핵심 흐름 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 하드코딩 목업 프론트를 실제 백엔드와 연동되는 SPA로 바꿔, 로그인·회원가입(역할 지정)부터 서버 탐색→예약→반납 핵심 흐름과 알림·요약 대시보드까지 동작하게 한다.

**Architecture:** React 18 + TS + Vite + Tailwind에 `react-router-dom`만 추가. `AuthContext`(JWT localStorage) + 경량 타입드 fetch 클라이언트(`lib/api`) + 작은 데이터 훅(`useApi`). 기능별 폴더, Style A 디자인 토큰. 백엔드는 통합 브랜치 `feature/integrate-ops-api`(전체 API 구동).

**Tech Stack:** React 18, TypeScript, Vite, Tailwind, react-router-dom v6, Vitest + React Testing Library + MSW(테스트).

**범위:** 토대 → 인증 → 핵심 바퀴(S2·S4·S5) → 알림(S6)·대시보드(S1). 역할 전용 화면(MGR 승인함·Quota, ADM 운영대시보드·가용성·AIOps·서버관리·계정)은 **후속 계획**(`2026-06-12-frontend-role-screens.md`)으로 분리. 설계 단일출처: `docs/superpowers/specs/2026-06-12-frontend-integration-design.md`, 시안: `.superpowers/brainstorm/*/content/*.html`.

**공통 규칙:** 커밋은 frontend 레포 `feature/frontend-integration` 브랜치. push는 사용자가 함. 주석 이모지 금지(rule.md). 색·간격 하드코딩 금지 — 토큰 사용.

---

## 파일 구조 (이 계획이 만드는/바꾸는 것)

```
src/
  index.css                      # 수정: Style A CSS 변수 토큰
  main.tsx                       # 수정: RouterProvider + AuthProvider
  App.tsx                        # 교체: 라우트 정의(기존 목업 제거)
  lib/
    api.ts                       # 생성: fetch 래퍼 + ApiError
    auth.ts                      # 생성: 토큰 storage 헬퍼
    format.ts                    # 생성: 표시 포맷(상태 라벨/색, 퍼센트)
  context/AuthContext.tsx        # 생성: user/token/login/logout
  hooks/useApi.ts                # 생성: 조회 훅(loading/error/data/refetch)
  hooks/useNotificationsSocket.ts# 생성: WS 알림 구독
  components/ui/
    Button.tsx Badge.tsx Input.tsx Field.tsx Segmented.tsx
    Table.tsx StatusBadge.tsx UsageBars.tsx Spinner.tsx Toast.tsx
  layout/{AppShell.tsx, Topbar.tsx, Sidebar.tsx, TraceBar.tsx}
  routes/{RequireAuth.tsx, RequireRole.tsx, nav.ts}
  features/
    auth/{LoginPage.tsx, SignupPage.tsx}
    servers/{ServerListPage.tsx, useServers.ts}
    reservations/{ReservePage.tsx, MyReservationsPage.tsx}
    notifications/AlertsPage.tsx
    dashboard/DashboardPage.tsx
  types/api.ts                   # 생성: 백엔드 응답 타입
tests/ (vitest)                  # 각 로직 단위 + 핵심 흐름
```

백엔드(통합 브랜치)에 1건 추가: `GET /teams`(비인증) — Task 7.

---

## Task 1: 의존성 + Style A 토큰

**Files:**
- Modify: `package.json` (deps: react-router-dom; devDeps: vitest, @testing-library/react, @testing-library/jest-dom, msw, jsdom)
- Modify: `src/index.css` (Style A 토큰)
- Create: `vitest.config.ts`, `src/test/setup.ts`

- [ ] **Step 1: 의존성 설치**

```bash
cd frontend
npm i react-router-dom@^6
npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event msw jsdom
```

- [ ] **Step 2: vitest 설정**

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: { environment: "jsdom", globals: true, setupFiles: ["./src/test/setup.ts"] },
});
```

`src/test/setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

`package.json` scripts 에 추가: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Style A 토큰을 index.css 에 정의**

`src/index.css` 의 `:root` 에 추가(시안 `auth-screens.html`과 동일 값):
```css
:root{
  --bg:#fff; --soft:#f8f9fa; --soft2:#f1f3f5; --text:#212529; --text2:#343a40; --mut:#6c757d;
  --bd:#dee2e6; --bd2:#e9ecef; --acc:#0d6efd; --accs:#e7f1ff; --acct:#084298;
  --ok:#198754; --oks:#d1e7dd; --use:#0d6efd; --uses:#e7f1ff; --rsv:#b07d05; --rsvs:#fff3cd;
  --mnt:#6c757d; --mnts:#eceef0; --dng:#dc3545; --dngs:#f8d7da;
  --mono:"JetBrains Mono",ui-monospace,Menlo,Consolas,monospace;
}
body{ font-family:"Pretendard Variable",Pretendard,system-ui,sans-serif; background:var(--soft); color:var(--text); font-feature-settings:"tnum"; }
```
Pretendard 임포트도 `index.css` 상단에 추가:
```css
@import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css");
```

- [ ] **Step 4: 빌드 확인 후 커밋**

Run: `npm run build` — Expected: 성공.
```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/index.css
git commit -m "chore: react-router·vitest 추가 및 Style A 토큰 정의"
```

---

## Task 2: API 타입 + fetch 클라이언트 (TDD)

**Files:**
- Create: `src/types/api.ts`, `src/lib/api.ts`
- Test: `src/lib/api.test.ts`

- [ ] **Step 1: 백엔드 응답 타입 정의**

`src/types/api.ts`:
```ts
export type Role = "STU" | "MGR" | "ADM";
export type ServerStatus = "AVAILABLE" | "RESERVED" | "IN_USE" | "MAINTENANCE";

export interface AuthUser { id: number; name: string; role: Role; teamId: number; }
export interface LoginResponse { accessToken: string; tokenType: string; expiresIn: number; user: AuthUser; }
export interface Me extends AuthUser { email: string; lockedUntil: string | null; }
export interface Team { id: number; name: string; code: string; }

export interface ServerSpec { cpuCores: number; ramGb: number; gpuModel: string | null; }
export interface ServerListItem { id: number; name: string; status: ServerStatus; spec: ServerSpec; healthScore: number | null; occupant: string | null; }
export interface ServerListResponse { servers: ServerListItem[]; }
export interface ServerAlternative { id: number; name: string; spec: { cpuCores: number; ramGb: number }; }
export interface ServerAlternativeResponse { alternatives: ServerAlternative[]; }

export interface Reservation { id: number; user_id: number; server_id: number; start_time: string; end_time: string; status: string; created_at: string; }
export interface Notification { id: number; user_id: number; type: string; message: string; payload: Record<string, unknown> | null; read_at: string | null; created_at: string; }
```

- [ ] **Step 2: 실패 테스트 작성 — ApiError 정규화**

`src/lib/api.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError, apiFetch } from "./api";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response);
}

describe("apiFetch", () => {
  beforeEach(() => { localStorage.clear(); });

  it("성공 응답의 JSON 을 반환한다", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { ok: true }));
    const data = await apiFetch<{ ok: boolean }>("/health");
    expect(data.ok).toBe(true);
  });

  it("토큰이 있으면 Authorization 헤더를 붙인다", async () => {
    localStorage.setItem("sh_token", "tok123");
    const f = mockFetch(200, {});
    vi.stubGlobal("fetch", f);
    await apiFetch("/servers");
    const headers = (f.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok123");
  });

  it("4xx 는 ApiError(status,message) 로 던진다", async () => {
    vi.stubGlobal("fetch", mockFetch(409, { detail: "충돌" }));
    await expect(apiFetch("/reservations", { method: "POST" }))
      .rejects.toMatchObject({ status: 409, message: "충돌" } satisfies Partial<ApiError>);
  });
});
```

- [ ] **Step 3: 실패 확인**

Run: `npm run test -- src/lib/api.test.ts` — Expected: FAIL ("Cannot find module './api'").

- [ ] **Step 4: 구현**

`src/lib/api.ts`:
```ts
const BASE = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8000";
const TOKEN_KEY = "sh_token";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); this.name = "ApiError"; }
}

export function getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }
export function setToken(t: string | null): void {
  if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY);
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
    const message = body?.detail ?? body?.message ?? `요청 실패 (${res.status})`;
    throw new ApiError(res.status, typeof message === "string" ? message : "요청 실패");
  }
  return body as T;
}
```

- [ ] **Step 5: 통과 확인 + 커밋**

Run: `npm run test -- src/lib/api.test.ts` — Expected: PASS (3 passed).
```bash
git add src/types/api.ts src/lib/api.ts src/lib/api.test.ts
git commit -m "feat: 타입드 API 클라이언트와 ApiError 정규화"
```

---

## Task 3: AuthContext + 인증 흐름

**Files:**
- Create: `src/context/AuthContext.tsx`
- Test: `src/context/AuthContext.test.tsx`

- [ ] **Step 1: 실패 테스트 — login 이 토큰을 저장하고 user 를 노출**

`src/context/AuthContext.test.tsx`:
```tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "./AuthContext";

function Probe() {
  const { user, login } = useAuth();
  return (
    <div>
      <span>user:{user?.name ?? "none"}</span>
      <button onClick={() => login("a@b.com", "password123")}>go</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => localStorage.clear());
  it("login 성공 시 user 를 채우고 토큰을 저장한다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200, text: async () =>
        JSON.stringify({ accessToken: "t1", tokenType: "bearer", expiresIn: 3600,
          user: { id: 1, name: "홍길동", role: "STU", teamId: 1 } }),
    } as Response));
    render(<AuthProvider><Probe /></AuthProvider>);
    await userEvent.click(screen.getByText("go"));
    await waitFor(() => expect(screen.getByText("user:홍길동")).toBeInTheDocument());
    expect(localStorage.getItem("sh_token")).toBe("t1");
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm run test -- src/context/AuthContext.test.tsx` → FAIL.

- [ ] **Step 3: 구현**

`src/context/AuthContext.tsx`:
```tsx
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
    if (!getToken()) { setReady(true); return; }
    apiFetch<Me>("/auth/me")
      .then((me) => setUser({ id: me.id, name: me.name, role: me.role, teamId: me.teamId }))
      .catch(() => setToken(null))
      .finally(() => setReady(true));
  }, []);

  async function login(email: string, password: string) {
    const res = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST", body: JSON.stringify({ email, password }),
    });
    setToken(res.accessToken);
    setUser(res.user);
  }

  function logout() { setToken(null); setUser(null); }

  return <Ctx.Provider value={{ user, ready, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
```

- [ ] **Step 4: 통과 확인 + 커밋**

Run: `npm run test -- src/context/AuthContext.test.tsx` → PASS.
```bash
git add src/context/AuthContext.tsx src/context/AuthContext.test.tsx
git commit -m "feat: AuthContext 로그인·세션 복원"
```

---

## Task 4: 표시 포맷 유틸 + 역할 가드 (TDD)

**Files:**
- Create: `src/lib/format.ts`, `src/routes/RequireAuth.tsx`, `src/routes/RequireRole.tsx`, `src/routes/nav.ts`
- Test: `src/lib/format.test.ts`

- [ ] **Step 1: 실패 테스트 — 상태 라벨/뱃지 클래스, 퍼센트**

`src/lib/format.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { statusLabel, statusBadgeClass, pct, healthClass } from "./format";

describe("format", () => {
  it("상태를 한글 라벨로", () => {
    expect(statusLabel("AVAILABLE")).toBe("가용");
    expect(statusLabel("IN_USE")).toBe("사용 중");
  });
  it("상태별 뱃지 클래스", () => {
    expect(statusBadgeClass("AVAILABLE")).toContain("b-ok");
    expect(statusBadgeClass("MAINTENANCE")).toContain("b-mnt");
  });
  it("null 사용률은 대시", () => {
    expect(pct(null)).toBe("—");
    expect(pct(41)).toBe("41");
  });
  it("건강점수 색 구간", () => {
    expect(healthClass(92)).toBe("h-ok");
    expect(healthClass(74)).toBe("h-md");
    expect(healthClass(40)).toBe("h-bad");
    expect(healthClass(null)).toBe("h-bad");
  });
});
```

- [ ] **Step 2: 실패 확인** — Run: `npm run test -- src/lib/format.test.ts` → FAIL.

- [ ] **Step 3: 구현**

`src/lib/format.ts`:
```ts
import type { ServerStatus } from "@/types/api";

const LABEL: Record<ServerStatus, string> = {
  AVAILABLE: "가용", RESERVED: "예약됨", IN_USE: "사용 중", MAINTENANCE: "점검",
};
const BADGE: Record<ServerStatus, string> = {
  AVAILABLE: "b-ok", RESERVED: "b-rsv", IN_USE: "b-use", MAINTENANCE: "b-mnt",
};

export function statusLabel(s: ServerStatus): string { return LABEL[s]; }
export function statusBadgeClass(s: ServerStatus): string { return `bdg ${BADGE[s]}`; }
export function pct(v: number | null): string { return v === null ? "—" : String(Math.round(v)); }
export function healthClass(v: number | null): string {
  if (v === null) return "h-bad";
  if (v >= 85) return "h-ok";
  if (v >= 60) return "h-md";
  return "h-bad";
}
```

- [ ] **Step 4: 라우트 가드 구현(테스트는 흐름 테스트에서 커버)**

`src/routes/RequireAuth.tsx`:
```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export function RequireAuth() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
```

`src/routes/RequireRole.tsx`:
```tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/types/api";

export function RequireRole({ roles }: { roles: Role[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return roles.includes(user.role) ? <Outlet /> : <Navigate to="/" replace />;
}
```

`src/routes/nav.ts` (역할별 사이드바 정의):
```ts
import type { Role } from "@/types/api";

export interface NavItem { to: string; label: string; icon: string; }
export interface NavGroup { title: string; roles: Role[]; items: NavItem[]; }

export const NAV_GROUPS: NavGroup[] = [
  { title: "운영", roles: ["STU", "MGR", "ADM"], items: [
    { to: "/", label: "대시보드", icon: "▦" },
    { to: "/servers", label: "서버 현황", icon: "▤" },
    { to: "/reservations", label: "내 예약", icon: "◷" },
    { to: "/alerts", label: "알림", icon: "◔" },
  ]},
  { title: "팀 관리", roles: ["MGR", "ADM"], items: [
    { to: "/approvals", label: "승인함", icon: "✓" },
    { to: "/quota", label: "Quota 관리", icon: "▣" },
  ]},
  { title: "서버 운영", roles: ["ADM"], items: [
    { to: "/ops", label: "운영 대시보드", icon: "▥" },
    { to: "/ops/availability", label: "가용성", icon: "◴" },
    { to: "/ops/aiops", label: "AIOps", icon: "◵" },
    { to: "/admin/servers", label: "서버 관리", icon: "▧" },
    { to: "/admin/accounts", label: "계정 잠금", icon: "⚿" },
  ]},
];

export function groupsForRole(role: Role): NavGroup[] {
  return NAV_GROUPS.filter((g) => g.roles.includes(role));
}
```

- [ ] **Step 5: 통과 확인 + 커밋**

Run: `npm run test -- src/lib/format.test.ts` → PASS.
```bash
git add src/lib/format.ts src/lib/format.test.ts src/routes/
git commit -m "feat: 표시 포맷 유틸·역할 가드·역할별 네비 정의"
```

---

## Task 5: UI 프리미티브 (Style A)

**Files:**
- Create: `src/components/ui/{Button,Badge,Input,Field,Segmented,Spinner,StatusBadge,UsageBars,Table}.tsx`

UI 프리미티브는 시안의 CSS 클래스를 Tailwind 임의값 또는 토큰 var로 구현한다. 색은 반드시 `var(--…)` 사용.

- [ ] **Step 1: Button**

`src/components/ui/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "pri" | "danger";
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: Variant; }

const base = "inline-flex items-center gap-1.5 rounded-[7px] px-3 py-2 text-[13px] font-semibold cursor-pointer disabled:cursor-not-allowed disabled:opacity-60";
const styles: Record<Variant, string> = {
  default: "border border-[var(--bd)] bg-[var(--bg)] text-[var(--text2)] hover:bg-[var(--soft)]",
  pri: "border border-[var(--acc)] bg-[var(--acc)] text-white hover:brightness-95",
  danger: "border border-[var(--dngs)] bg-[var(--bg)] text-[var(--dng)] hover:bg-[var(--dngs)]",
};

export function Button({ variant = "default", className = "", ...rest }: Props) {
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest} />;
}
```

- [ ] **Step 2: StatusBadge + Badge**

`src/components/ui/StatusBadge.tsx`:
```tsx
import type { ServerStatus } from "@/types/api";
import { statusLabel } from "@/lib/format";

const cls: Record<ServerStatus, string> = {
  AVAILABLE: "bg-[var(--oks)] text-[#0f5132]",
  IN_USE: "bg-[var(--uses)] text-[var(--acct)]",
  RESERVED: "bg-[var(--rsvs)] text-[#664d03]",
  MAINTENANCE: "bg-[var(--mnts)] text-[var(--mut)]",
};

export function StatusBadge({ status }: { status: ServerStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${cls[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
```

- [ ] **Step 3: 나머지 프리미티브**

`Input.tsx`(텍스트 입력, 토큰 테두리), `Field.tsx`(`.lbl` 라벨 + children), `Segmented.tsx`(옵션 배열 + value + onChange, 시안 `.seg` 스타일), `Spinner.tsx`(로딩), `UsageBars.tsx`(cpu/mem/gpu 미니막대 — 시안 `.use/.bar` 구조, `i.hi`(>=85)·`i.md`(>=60) 색), `Table.tsx`(`<table>` 래퍼 + thead/tbody 토큰 스타일). 각 파일은 props 타입을 명시하고 색은 `var(--…)`로.

`Segmented.tsx` 시그니처:
```tsx
interface Opt<T> { value: T; label: string; sub?: string; }
export function Segmented<T extends string>({ options, value, onChange }:
  { options: Opt<T>[]; value: T; onChange: (v: T) => void }) { /* .seg 마크업 */ }
```

`UsageBars.tsx` 시그니처:
```tsx
export function UsageBars({ cpu, mem, gpu }:
  { cpu: number | null; mem: number | null; gpu: number | null }) { /* .use 마크업 */ }
```

- [ ] **Step 4: 빌드 확인 + 커밋**

Run: `npm run build` → 성공.
```bash
git add src/components/ui/
git commit -m "feat: Style A UI 프리미티브"
```

---

## Task 6: 앱 셸(레이아웃) + 라우터 골격

**Files:**
- Create: `src/layout/{Topbar,Sidebar,TraceBar,AppShell}.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Topbar**

`src/layout/Topbar.tsx`: 브랜드(SH) + spacer + 사용자(아바타 이니셜·이름·역할뱃지·팀) + 로그아웃 버튼(`useAuth().logout()` 후 `/login` 이동). 시안 `.top/.who` 구조.

- [ ] **Step 2: Sidebar**

`src/layout/Sidebar.tsx`: `groupsForRole(user.role)` 로 그룹 렌더, 각 item 은 `NavLink`(react-router) — active 시 `.nav.on`. 시안 `.side/.navgrp/.nav` 구조. 하단 `설계 추적 모드` foot.

- [ ] **Step 3: TraceBar**

`src/layout/TraceBar.tsx`:
```tsx
interface Trace { screen: string; api: string; feature: string; uc: string; entity: string; }
export function TraceBar({ screen, api, feature, uc, entity }: Trace) { /* .tracebar 마크업 */ }
```

- [ ] **Step 4: AppShell**

`src/layout/AppShell.tsx`: `<Topbar/>` + `<div class=shell><Sidebar/><main><Outlet/></main></div>`. (각 페이지가 자체 TraceBar·phead 렌더.)

- [ ] **Step 5: 라우터 구성**

`src/App.tsx` (기존 목업 전부 제거):
```tsx
import { Routes, Route } from "react-router-dom";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";
import { AppShell } from "@/layout/AppShell";
import { LoginPage } from "@/features/auth/LoginPage";
import { SignupPage } from "@/features/auth/SignupPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ServerListPage } from "@/features/servers/ServerListPage";
import { ReservePage } from "@/features/reservations/ReservePage";
import { MyReservationsPage } from "@/features/reservations/MyReservationsPage";
import { AlertsPage } from "@/features/notifications/AlertsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/servers" element={<ServerListPage />} />
          <Route path="/servers/:id/reserve" element={<ReservePage />} />
          <Route path="/reservations" element={<MyReservationsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
```

`src/main.tsx`: `<BrowserRouter><AuthProvider><App/></AuthProvider></BrowserRouter>` 로 감싼다.

> 페이지 컴포넌트는 후속 태스크에서 구현하므로, 이 태스크에서는 각 페이지를 `export function X(){return <div/>}` 빈 스텁으로 먼저 만들어 빌드를 통과시킨다(다음 태스크에서 내용 채움).

- [ ] **Step 6: 빌드 + 커밋**

Run: `npm run build` → 성공.
```bash
git add src/layout/ src/App.tsx src/main.tsx src/features/
git commit -m "feat: 앱 셸·라우터 골격(페이지 스텁)"
```

---

## Task 7: 백엔드 GET /teams (회원가입 팀 선택용)

**Files (backend 레포 `feature/integrate-ops-api` 브랜치):**
- Create: `app/api/teams_public.py` 또는 `app/api/teams.py` 에 라우트 추가
- Create/Modify: `app/schemas/team.py`
- Test: `tests/integration/test_teams_api.py`

- [ ] **Step 1: 스키마**

`app/schemas/team.py`:
```python
from pydantic import BaseModel, ConfigDict, Field

class TeamItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str

class TeamListResponse(BaseModel):
    teams: list[TeamItem]
```

- [ ] **Step 2: 라우트(비인증) 추가 to `app/api/teams.py`**

```python
from sqlalchemy import select
from app.schemas.team import TeamItem, TeamListResponse
from app.models import Team

@router.get("", response_model=TeamListResponse)
async def list_teams(db: AsyncSession = Depends(get_db)) -> TeamListResponse:
    rows = (await db.execute(select(Team).order_by(Team.name))).scalars().all()
    return TeamListResponse(teams=[TeamItem.model_validate(t) for t in rows])
```
(import `get_db`, `select`, `AsyncSession` 확인.)

- [ ] **Step 3: 통합 테스트**

`tests/integration/test_teams_api.py`:
```python
import pytest
pytestmark = pytest.mark.integration

async def test_list_teams_is_public(client):
    res = await client.get("/teams")
    assert res.status_code == 200
    teams = res.json()["teams"]
    assert any(t["code"] == "LAB-A" for t in teams)
```

- [ ] **Step 4: 실행 + 커밋(backend)**

Run: `.venv/bin/python -m pytest tests/integration/test_teams_api.py -q` → PASS.
```bash
cd ../backend && git add app/api/teams.py app/schemas/team.py tests/integration/test_teams_api.py
git commit -m "feat: GET /teams (회원가입 팀 선택용, 비인증)"
```

---

## Task 8: 로그인 페이지 (C1)

**Files:**
- Modify: `src/features/auth/LoginPage.tsx`
- Test: `src/features/auth/LoginPage.test.tsx`

- [ ] **Step 1: 흐름 테스트(MSW)**

`src/features/auth/LoginPage.test.tsx`: MSW 로 `POST /auth/login` 200 목 → 이메일·비번 입력·제출 → `useAuth().user` 채워지고 `/` 로 이동(`useNavigate` mock 또는 MemoryRouter + 라우트). 401 목 → 에러 메시지 "이메일 또는 비밀번호가 올바르지 않습니다." 표시.

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { LoginPage } from "./LoginPage";
// MSW 서버는 src/test/server.ts 에 구성(아래 Step 2)

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>홈</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

it("로그인 성공 시 홈으로 이동", async () => {
  renderLogin();
  await userEvent.type(screen.getByLabelText("이메일"), "hong@example.com");
  await userEvent.type(screen.getByLabelText("비밀번호"), "password123");
  await userEvent.click(screen.getByRole("button", { name: "로그인" }));
  expect(await screen.findByText("홈")).toBeInTheDocument();
});
```

- [ ] **Step 2: MSW 핸들러 베이스**

`src/test/server.ts`: `setupServer(...)` + `beforeAll/afterEach/afterAll`. 각 테스트에서 `server.use(...)`로 핸들러 오버라이드. setup.ts 에 연결.

- [ ] **Step 3: 실패 확인** — Run: `npm run test -- LoginPage` → FAIL.

- [ ] **Step 4: 구현 — 가운데 카드형(시안 vA)**

`LoginPage.tsx`: 시안 `auth-screens.html` 의 `login-centered` 마크업을 React로. 상태: `email,password,error`. 제출 시 `useAuth().login` 호출, 성공이면 `navigate("/")`, 실패면 `ApiError.message` 표시(429면 잠금 안내 문구). "회원가입" 링크 → `/signup`. 라벨은 `htmlFor`/`id`로 연결(`getByLabelText` 가능하게).

- [ ] **Step 5: 통과 + 커밋**

Run: `npm run test -- LoginPage` → PASS.
```bash
git add src/features/auth/LoginPage.tsx src/features/auth/LoginPage.test.tsx src/test/server.ts
git commit -m "feat: 로그인 페이지(C1) 연동"
```

---

## Task 9: 회원가입 페이지 (C2, 역할 세그먼트)

**Files:**
- Modify: `src/features/auth/SignupPage.tsx`
- Test: `src/features/auth/SignupPage.test.tsx`

- [ ] **Step 1: 흐름 테스트(MSW)**

`GET /teams` 목(LAB-A 포함), `POST /auth/register` 201 목 → 이름·이메일·비번 입력, 역할 세그먼트에서 "서버 관리자(ADM)" 선택, 팀 선택, 제출 → 성공 안내/`/login` 이동. 409(중복 이메일) 목 → "이미 가입된 이메일입니다." 표시.

- [ ] **Step 2: 실패 확인** — FAIL.

- [ ] **Step 3: 구현 — 시안 signup-segmented**

`SignupPage.tsx`: 마운트 시 `GET /teams`로 팀 옵션 로드. 상태: `name,email,password,role(기본 STU),teamId,error`. `Segmented` 로 역할 선택(STU/MGR/ADM) + 과제 안내 노트. 제출 → `apiFetch("/auth/register", {method:"POST", body: JSON.stringify({name,email,password,role,teamId})})`. 201이면 `/login`(또는 자동 로그인). 409/422 에러 표시.

- [ ] **Step 4: 통과 + 커밋**

Run: `npm run test -- SignupPage` → PASS.
```bash
git add src/features/auth/SignupPage.tsx src/features/auth/SignupPage.test.tsx
git commit -m "feat: 회원가입 페이지(C2) 역할 직접 지정"
```

---

## Task 10: useApi 훅 + 서버 현황 (S2)

**Files:**
- Create: `src/hooks/useApi.ts`, `src/features/servers/useServers.ts`
- Modify: `src/features/servers/ServerListPage.tsx`
- Test: `src/hooks/useApi.test.tsx`, `src/features/servers/ServerListPage.test.tsx`

- [ ] **Step 1: useApi 실패 테스트**

`src/hooks/useApi.test.tsx`: 성공 fetch 목 → `{loading:true}`→`{loading:false,data}`. 에러 목 → `{error}`. `refetch()` 재호출.

- [ ] **Step 2: 구현 useApi**

`src/hooks/useApi.ts`:
```tsx
import { useCallback, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

interface State<T> { data: T | null; loading: boolean; error: ApiError | null; }

export function useApi<T>(path: string | null): State<T> & { refetch: () => void } {
  const [state, setState] = useState<State<T>>({ data: null, loading: path !== null, error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (path === null) return;
    let active = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    apiFetch<T>(path)
      .then((data) => active && setState({ data, loading: false, error: null }))
      .catch((e) => active && setState({ data: null, loading: false, error: e as ApiError }));
    return () => { active = false; };
  }, [path, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, refetch };
}
```

- [ ] **Step 3: useServers**

`src/features/servers/useServers.ts`: 필터 상태(status/group/sort) → querystring 조립 → `useApi<ServerListResponse>("/servers?...")`. 반환: `{servers, loading, error, refetch, filters, setFilters}`.

- [ ] **Step 4: ServerListPage 흐름 테스트**

`GET /servers` 목(4대, 상태 다양) → 테이블에 이름·상태뱃지 렌더, 가용 서버 예약 버튼 활성/그 외 비활성. 상태 칩 클릭 시 querystring 반영(요청 URL 검증).

- [ ] **Step 5: 구현 ServerListPage (시안 shell-server-list)**

TraceBar(screen=서버 현황, api=GET /servers, feature=F01, uc=UC01, entity=Server·Reservation) + phead + 요약 strip(상태별 카운트) + 필터 칩/셀렉트 + `Table`(서버/상태/사양/UsageBars/건강/점유자/예약버튼). 예약 버튼 → `navigate("/servers/{id}/reserve")`. "즉시 요청" 버튼 → 즉시 요청 모달(Task 11에서 endTime만 받는 폼) 또는 ReservePage 재사용. 로딩은 Spinner, 에러는 메시지+재시도.

- [ ] **Step 6: 통과 + 커밋**

Run: `npm run test -- useApi ServerListPage` → PASS.
```bash
git add src/hooks/useApi.ts src/hooks/useApi.test.tsx src/features/servers/
git commit -m "feat: useApi 훅·서버 현황(S2) 연동"
```

---

## Task 11: 예약 생성 (S4)

**Files:**
- Modify: `src/features/reservations/ReservePage.tsx`
- Test: `src/features/reservations/ReservePage.test.tsx`

- [ ] **Step 1: 흐름 테스트(MSW)**

라우트 `/servers/:id/reserve`. `GET /servers/{id}` 목으로 대상 표시. 시작·종료 시각 입력 → 제출 → `POST /reservations` 201 → `/reservations` 이동. **409** 목 → `GET /servers/alternatives?serverId=` 호출해 대안 목록 노출 + 안내. **422**(Quota 초과) 목 → 승인 요청 폼으로 전환(`POST /approval-requests`).

- [ ] **Step 2: 실패 확인** → FAIL.

- [ ] **Step 3: 구현**

`ReservePage.tsx`: `useParams().id` → `useApi<ServerListItem>("/servers/{id}")`로 대상. 폼: `startTime,endTime`(datetime-local). 제출 → `POST /reservations {serverId,startTime,endTime}`.
- 성공(201) → toast + `navigate("/reservations")`.
- `ApiError.status===409` → `apiFetch("/servers/alternatives?serverId={id}")` 호출, 대안 카드 리스트 표시("이 서버는 충돌했습니다. 대안:"). 대안 클릭 시 그 서버로 재시도.
- `===422` → "Quota를 초과했습니다. 승인을 요청하시겠어요?" → 사유 입력 + `POST /approval-requests {serverId,startTime,endTime,reason}` → PENDING 안내.
- `===429` → 잠금 안내.
TraceBar(api=POST /reservations, feature=F04, uc=UC04·05·08).
즉시 요청 경로: 같은 페이지에 "즉시 요청" 모드(endTime만) → `POST /reservations/instant {endTime}`.

- [ ] **Step 4: 통과 + 커밋**

Run: `npm run test -- ReservePage` → PASS.
```bash
git add src/features/reservations/ReservePage.tsx src/features/reservations/ReservePage.test.tsx
git commit -m "feat: 예약 생성(S4)·충돌 대안·Quota 승인 분기"
```

---

## Task 12: 내 예약 (S5)

**Files:**
- Modify: `src/features/reservations/MyReservationsPage.tsx`
- Test: `src/features/reservations/MyReservationsPage.test.tsx`

- [ ] **Step 1: 흐름 테스트(MSW)**

`GET /reservations` 목(RESERVED·IN_USE·RETURNED 섞임) → 상태별 그룹 렌더. RESERVED 행 "취소" → `POST /reservations/{id}/cancel` → 목록 갱신. IN_USE 행 "반납" → `POST /reservations/{id}/return` → 갱신.

- [ ] **Step 2: 실패 확인** → FAIL.

- [ ] **Step 3: 구현**

`MyReservationsPage.tsx`: `useApi<Reservation[]>("/reservations")`. 상태별 섹션. 각 행에 기간·서버. RESERVED → 취소 버튼, IN_USE → 반납 버튼(`apiFetch(...,{method:"POST"})` 후 `refetch()`). 만료 임박(end_time 근접) 경고 뱃지. TraceBar(api=GET /reservations·.../cancel·/return, uc=UC02·06·07).

- [ ] **Step 4: 통과 + 커밋**

Run: `npm run test -- MyReservationsPage` → PASS.
```bash
git add src/features/reservations/MyReservationsPage.tsx src/features/reservations/MyReservationsPage.test.tsx
git commit -m "feat: 내 예약(S5) 취소·반납"
```

---

## Task 13: 알림 (S6) + WS

**Files:**
- Create: `src/hooks/useNotificationsSocket.ts`
- Modify: `src/features/notifications/AlertsPage.tsx`, `src/layout/Topbar.tsx`(배지)
- Test: `src/features/notifications/AlertsPage.test.tsx`

- [ ] **Step 1: 흐름 테스트(MSW)**

`GET /notifications` 목 → 목록 렌더(읽음/안읽음 구분). 항목 "읽음" → `PATCH /notifications/{id}/read` → read_at 채워지고 스타일 변경.

- [ ] **Step 2: 구현 AlertsPage**

`useApi<Notification[]>("/notifications")`. 안읽음(`read_at===null`) 강조. 클릭/버튼 → `PATCH /notifications/{id}/read` 후 refetch. TraceBar(api=GET·PATCH /notifications, uc=UC03-a).

- [ ] **Step 3: WS 훅(있으면 실시간, 없으면 폴백)**

`useNotificationsSocket.ts`: `new WebSocket(WS_BASE + "/ws/notifications?token=...")` 구독, 메시지 수신 시 콜백. 연결 실패해도 앱은 동작(목록 조회로 폴백). Topbar 알림 배지에 안읽음 수 표시. (WS 인증 방식은 백엔드 `app/api/ws.py` 확인해 토큰 전달 방법 맞춤 — 쿼리 파라미터 또는 첫 메시지.)

- [ ] **Step 4: 통과 + 커밋**

Run: `npm run test -- AlertsPage` → PASS.
```bash
git add src/hooks/useNotificationsSocket.ts src/features/notifications/ src/layout/Topbar.tsx
git commit -m "feat: 알림(S6) 목록·읽음·WS 배지"
```

---

## Task 14: 대시보드 (S1, 요약)

**Files:**
- Modify: `src/features/dashboard/DashboardPage.tsx`
- Test: `src/features/dashboard/DashboardPage.test.tsx`

- [ ] **Step 1: 흐름 테스트(MSW)**

`GET /servers` + `GET /reservations` + `GET /notifications` 목 → 요약 카드(가용 N대, 내 예약 M건, 안읽음 K) 렌더.

- [ ] **Step 2: 구현**

`DashboardPage.tsx`: 세 조회를 병렬(`useApi` 3개)로 받아 요약 strip + 최근 알림 + 내 예약 미리보기. "지금 빌릴 수 있나"가 한눈에. STU 기준 화면, 모든 역할 공통. TraceBar(uc=UC01·02·03·10).

- [ ] **Step 3: 통과 + 커밋**

Run: `npm run test -- DashboardPage` → PASS.
```bash
git add src/features/dashboard/DashboardPage.tsx src/features/dashboard/DashboardPage.test.tsx
git commit -m "feat: 대시보드(S1) 요약"
```

---

## Task 15: 수동 E2E 검증 + 문서

**Files:**
- Modify: `frontend/README.md`(실행법·로그인 계정), `frontend/tree.md`(구조)

- [ ] **Step 1: 백엔드 기동 + seed**

```bash
cd ../backend && docker compose up -d && docker compose exec api alembic upgrade head
docker compose exec api python -m scripts.seed   # 계정: hong@example.com / kim@example.com / password123
```

- [ ] **Step 2: 프론트 기동 + 수동 흐름**

```bash
cd ../frontend && npm run dev    # http://localhost:5173
```
확인: 회원가입(ADM 역할로 가입) → 로그인 → 서버 현황 → 예약 → 내 예약에서 반납 → 알림. 역할별 사이드바 차이(STU/MGR/ADM) 확인.

- [ ] **Step 3: 전체 테스트 + 빌드**

Run: `npm run test && npm run build` → 전부 PASS/성공.

- [ ] **Step 4: 문서 갱신 + 커밋**

README 에 실행법·시드 계정·localStorage 토큰 메모, tree.md 에 새 구조 반영.
```bash
git add README.md tree.md
git commit -m "docs: 실행법·구조 갱신"
```

---

## 자체 점검 (spec 대비)

- 인증(C1·C2 역할 지정) → Task 8·9 ✓ / 백엔드 role 가입은 기구현·`GET /teams` Task 7 ✓
- 핵심 바퀴 S2·S4·S5 → Task 10·11·12 ✓ (409 대안·422 승인·instant 포함)
- 알림 S6(WS·읽음) → Task 13 ✓ (`PATCH /notifications/{id}/read` 백엔드 기구현)
- 대시보드 S1 → Task 14 ✓
- 셸·역할 네비·추적바 → Task 4·6 ✓
- 경량 데이터 훅·api 클라이언트·에러 정규화(401/403/409/422/429) → Task 2·10·11 ✓
- 역할 전용 화면(MGR/ADM 상세)·S3 서버 상세 → **후속 계획**으로 분리(명시).
- 테스트: 로직 단위 TDD + 핵심 흐름 MSW + 수동 E2E → 각 태스크 ✓
```
