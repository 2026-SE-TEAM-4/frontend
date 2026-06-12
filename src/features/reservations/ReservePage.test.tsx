import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { server } from "@/test/server";
import { ReservePage } from "./ReservePage";

const API = "http://localhost:8000";

const DETAIL = {
  id: 1,
  name: "gpu-01",
  status: "AVAILABLE",
  spec: { cpuCores: 16, ramGb: 64, gpuModel: "RTX4090" },
  healthScore: 90,
};

function renderReserve() {
  return render(
    <MemoryRouter initialEntries={["/servers/1/reserve"]}>
      <Routes>
        <Route path="/servers/:id/reserve" element={<ReservePage />} />
        <Route path="/reservations" element={<div>내 예약 화면</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillTimes() {
  await userEvent.type(screen.getByLabelText("시작 시각"), "2026-06-20T09:00");
  await userEvent.type(screen.getByLabelText("종료 시각"), "2026-06-21T09:00");
}

describe("ReservePage", () => {
  it("예약 성공 시 내 예약으로 이동", async () => {
    server.use(
      http.get(`${API}/servers/1`, () => HttpResponse.json(DETAIL)),
      http.post(`${API}/reservations`, () =>
        HttpResponse.json({ id: 10, status: "RESERVED" }, { status: 201 }),
      ),
    );
    renderReserve();
    await screen.findByText(/gpu-01/);
    await fillTimes();
    await userEvent.click(screen.getByRole("button", { name: "예약하기" }));
    expect(await screen.findByText("내 예약 화면")).toBeInTheDocument();
  });

  it("409 충돌 시 대안 서버를 보여준다", async () => {
    server.use(
      http.get(`${API}/servers/1`, () => HttpResponse.json(DETAIL)),
      http.post(`${API}/reservations`, () => HttpResponse.json({ detail: "충돌" }, { status: 409 })),
      http.get(`${API}/servers/alternatives`, () =>
        HttpResponse.json({ alternatives: [{ id: 2, name: "gpu-02", spec: { cpuCores: 16, ramGb: 64 } }] }),
      ),
    );
    renderReserve();
    await screen.findByText(/gpu-01/);
    await fillTimes();
    await userEvent.click(screen.getByRole("button", { name: "예약하기" }));
    expect(await screen.findByText("대안 서버 (유사 사양 · 가용)")).toBeInTheDocument();
    expect(screen.getByText("gpu-02")).toBeInTheDocument();
  });

  it("422 Quota 초과 시 승인 요청 폼을 보여준다", async () => {
    server.use(
      http.get(`${API}/servers/1`, () => HttpResponse.json(DETAIL)),
      http.post(`${API}/reservations`, () => HttpResponse.json({ detail: "quota" }, { status: 422 })),
    );
    renderReserve();
    await screen.findByText(/gpu-01/);
    await fillTimes();
    await userEvent.click(screen.getByRole("button", { name: "예약하기" }));
    expect(await screen.findByText("승인 요청")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "승인 요청 보내기" })).toBeInTheDocument();
  });
});
