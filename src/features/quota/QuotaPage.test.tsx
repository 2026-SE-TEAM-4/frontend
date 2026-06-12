import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/context/AuthContext";
import { setToken } from "@/lib/api";
import { server } from "@/test/server";
import { QuotaPage } from "./QuotaPage";

const API = "http://localhost:8000";

const QUOTAS = [{ id: 100, user_id: 4, user_name: "홍길동", team_id: 1, limit: 2, used: 1, version: 1 }];

function meHandler() {
  return http.get(`${API}/auth/me`, () =>
    HttpResponse.json({ id: 9, name: "김관리", role: "MGR", teamId: 1, email: "m@b.com", lockedUntil: null }),
  );
}

describe("QuotaPage", () => {
  beforeEach(() => setToken("mgr-token"));

  it("한도를 수정해 저장하면 PATCH 에 version 이 담긴다", async () => {
    let patched: Record<string, unknown> | null = null;
    server.use(
      meHandler(),
      http.get(`${API}/teams/1/quotas`, () => HttpResponse.json(patched ? [{ ...QUOTAS[0], limit: 5, version: 2 }] : QUOTAS)),
      http.patch(`${API}/quotas/100`, async ({ request }) => {
        patched = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 100, limit: 5, used: 1, version: 2 });
      }),
    );
    render(
      <MemoryRouter>
        <AuthProvider>
          <QuotaPage />
        </AuthProvider>
      </MemoryRouter>,
    );
    const input = (await screen.findByLabelText("홍길동 한도")) as HTMLInputElement;
    await userEvent.clear(input);
    await userEvent.type(input, "5");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() => expect(patched).toMatchObject({ limit: 5, version: 1 }));
  });
});
