import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { AuthProvider } from "@/context/AuthContext";
import { server } from "@/test/server";
import { DashboardPage } from "./DashboardPage";

const API = "http://localhost:8000";

describe("DashboardPage", () => {
  it("가용 서버·진행 예약·안읽은 알림 수를 요약한다", async () => {
    server.use(
      http.get(`${API}/servers`, () =>
        HttpResponse.json({
          servers: [
            { id: 1, name: "a", status: "AVAILABLE", spec: { cpuCores: 8, ramGb: 32, gpuModel: null }, healthScore: 90, occupant: null },
            { id: 2, name: "b", status: "IN_USE", spec: { cpuCores: 8, ramGb: 32, gpuModel: null }, healthScore: 80, occupant: "x" },
          ],
        }),
      ),
      http.get(`${API}/reservations`, () =>
        HttpResponse.json([
          { id: 1, user_id: 1, server_id: 2, start_time: "x", end_time: "y", status: "IN_USE", created_at: "z" },
        ]),
      ),
      http.get(`${API}/notifications`, () =>
        HttpResponse.json([
          { id: 1, user_id: 1, type: "T", message: "새 알림", payload: null, read_at: null, created_at: "z" },
        ]),
      ),
    );

    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("지금 가용한 서버")).toBeInTheDocument();
    // 가용 1, 진행 예약 1, 안읽음 1
    const ones = screen.getAllByText("1");
    expect(ones.length).toBeGreaterThanOrEqual(3);
    expect(screen.getByText(/새 알림/)).toBeInTheDocument();
  });
});
