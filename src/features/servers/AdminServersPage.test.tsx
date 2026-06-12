import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { server } from "@/test/server";
import { AdminServersPage } from "./AdminServersPage";

const API = "http://localhost:8000";

const SERVERS = {
  servers: [
    { id: 1, name: "gpu-01", status: "AVAILABLE", spec: { cpuCores: 16, ramGb: 64, gpuModel: "RTX4090" }, healthScore: 90, occupant: null },
  ],
};

describe("AdminServersPage", () => {
  it("서버 등록 폼 제출 시 POST /servers 를 호출한다", async () => {
    let created: Record<string, unknown> | null = null;
    server.use(
      http.get(`${API}/servers`, () => HttpResponse.json(SERVERS)),
      http.post(`${API}/servers`, async ({ request }) => {
        created = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ id: 9, status: "AVAILABLE", version: 1 }, { status: 201 });
      }),
    );
    render(
      <MemoryRouter>
        <AdminServersPage />
      </MemoryRouter>,
    );
    await screen.findByText("gpu-01");
    await userEvent.type(screen.getByLabelText("이름"), "gpu-09");
    await userEvent.type(screen.getByLabelText("IP"), "10.0.0.9");
    await userEvent.click(screen.getByRole("button", { name: "서버 등록" }));
    await waitFor(() => expect(created).toMatchObject({ name: "gpu-09", ip: "10.0.0.9", cpuCores: 16 }));
  });

  it("삭제 시 활성 예약(409)이면 안내한다", async () => {
    server.use(
      http.get(`${API}/servers`, () => HttpResponse.json(SERVERS)),
      http.delete(`${API}/servers/1`, () => HttpResponse.json({ detail: "활성 예약" }, { status: 409 })),
    );
    render(
      <MemoryRouter>
        <AdminServersPage />
      </MemoryRouter>,
    );
    await screen.findByText("gpu-01");
    await userEvent.click(screen.getByRole("button", { name: "gpu-01 삭제" }));
    expect(await screen.findByText(/활성 예약이 있어/)).toBeInTheDocument();
  });
});
