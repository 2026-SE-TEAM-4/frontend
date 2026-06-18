import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/context/AuthContext";
import { server } from "@/test/server";
import { LoginPage } from "./LoginPage";

const API = "http://localhost:8000";

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<div>홈 화면</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  it("로그인 성공 시 홈으로 이동한다", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({
          accessToken: "t1",
          tokenType: "bearer",
          expiresIn: 3600,
          user: { id: 1, name: "홍길동", role: "STU", teamId: 1 },
        }),
      ),
    );
    renderLogin();
    await userEvent.type(screen.getByLabelText("이메일"), "hong@example.com");
    await userEvent.type(screen.getByLabelText("비밀번호"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "로그인" }));
    expect(await screen.findByText("홈 화면")).toBeInTheDocument();
  });

  it("데모 로그인 버튼(MGR)을 누르면 해당 계정으로 로그인한다", async () => {
    let sentBody: { email?: string; password?: string } = {};
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        sentBody = (await request.json()) as { email?: string; password?: string };
        return HttpResponse.json({
          accessToken: "t1",
          tokenType: "bearer",
          expiresIn: 3600,
          user: { id: 2, name: "김관리", role: "MGR", teamId: 1 },
        });
      }),
    );
    renderLogin();
    await userEvent.click(screen.getByRole("button", { name: "MGR" }));
    expect(await screen.findByText("홈 화면")).toBeInTheDocument();
    expect(sentBody.email).toBe("kim@example.com");
    expect(sentBody.password).toBe("password123");
  });

  it("401 이면 에러 메시지를 보여준다", async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ detail: "이메일 또는 비밀번호가 올바르지 않습니다." }, { status: 401 }),
      ),
    );
    renderLogin();
    await userEvent.type(screen.getByLabelText("이메일"), "x@y.com");
    await userEvent.type(screen.getByLabelText("비밀번호"), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: "로그인" }));
    expect(await screen.findByText(/올바르지 않습니다/)).toBeInTheDocument();
  });
});
