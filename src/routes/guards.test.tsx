import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/context/AuthContext";
import { server } from "@/test/server";
import type { Role } from "@/types/api";
import { RequireAuth } from "./RequireAuth";
import { RequireRole } from "./RequireRole";

const API = "http://localhost:8000";

function seedUser(role: Role) {
  localStorage.setItem("sh_token", "t1");
  server.use(
    http.get(`${API}/auth/me`, () =>
      HttpResponse.json({
        id: 1,
        name: "테스터",
        role,
        teamId: 1,
        email: "t@example.com",
        lockedUntil: null,
      }),
    ),
  );
}

// 보호된 라우트(/approvals: MGR·ADM 전용)와 공개 대상지(/login, /)를 갖춘 작은 라우터.
function renderAt(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>로그인 화면</div>} />
          <Route element={<RequireAuth />}>
            <Route path="/" element={<div>홈 화면</div>} />
            <Route element={<RequireRole roles={["MGR", "ADM"]} />}>
              <Route path="/approvals" element={<div>승인 화면</div>} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("route guards", () => {
  beforeEach(() => localStorage.clear());

  it("미인증 사용자가 보호된 라우트에 접근하면 /login 으로 보낸다", async () => {
    renderAt("/approvals");
    expect(await screen.findByText("로그인 화면")).toBeInTheDocument();
    expect(screen.queryByText("승인 화면")).not.toBeInTheDocument();
  });

  it("STU 가 MGR·ADM 전용 라우트에 접근하면 홈(/)으로 보낸다", async () => {
    seedUser("STU");
    renderAt("/approvals");
    expect(await screen.findByText("홈 화면")).toBeInTheDocument();
    expect(screen.queryByText("승인 화면")).not.toBeInTheDocument();
  });

  it("MGR 은 MGR·ADM 전용 라우트에 정상 접근한다", async () => {
    seedUser("MGR");
    renderAt("/approvals");
    expect(await screen.findByText("승인 화면")).toBeInTheDocument();
  });
});
