import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { server } from "@/test/server";
import { SignupPage } from "./SignupPage";

const API = "http://localhost:8000";

function teamsHandler() {
  return http.get(`${API}/teams`, () =>
    HttpResponse.json({ teams: [{ id: 1, name: "Lab-A", code: "LAB-A" }] }),
  );
}

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={["/signup"]}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<div>로그인 화면</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SignupPage", () => {
  it("ADM 역할로 가입하면 등록 요청에 role=ADM 이 담긴다", async () => {
    let captured: Record<string, unknown> | null = null;
    server.use(
      teamsHandler(),
      http.post(`${API}/auth/register`, async ({ request }) => {
        captured = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 9, name: "관리자", email: "a@b.com", role: "ADM", teamId: 1 }, { status: 201 });
      }),
    );
    renderSignup();
    await screen.findByText("Lab-A (LAB-A)");
    await userEvent.type(screen.getByLabelText("이름"), "관리자");
    await userEvent.type(screen.getByLabelText("이메일"), "a@b.com");
    await userEvent.type(screen.getByLabelText("비밀번호 (8자 이상)"), "password123");
    await userEvent.click(screen.getByRole("radio", { name: /서버 관리자/ }));
    await userEvent.click(screen.getByRole("button", { name: "가입하기" }));
    expect(await screen.findByText(/가입 완료/)).toBeInTheDocument();
    expect(captured).toMatchObject({ role: "ADM", teamId: 1, name: "관리자" });
  });

  it("409 면 중복 이메일 안내를 보여준다", async () => {
    server.use(
      teamsHandler(),
      http.post(`${API}/auth/register`, () =>
        HttpResponse.json({ detail: "이미 가입된 이메일입니다." }, { status: 409 }),
      ),
    );
    renderSignup();
    await screen.findByText("Lab-A (LAB-A)");
    await userEvent.type(screen.getByLabelText("이름"), "홍길동");
    await userEvent.type(screen.getByLabelText("이메일"), "dup@b.com");
    await userEvent.type(screen.getByLabelText("비밀번호 (8자 이상)"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "가입하기" }));
    expect(await screen.findByText(/이미 가입된 이메일/)).toBeInTheDocument();
  });
});
