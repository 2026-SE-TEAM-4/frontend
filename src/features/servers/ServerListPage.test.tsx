import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { server } from "@/test/server";
import { ServerListPage } from "./ServerListPage";

const API = "http://localhost:8000";

const SERVERS = [
  { id: 1, name: "gpu-01", status: "AVAILABLE", spec: { cpuCores: 16, ramGb: 64, gpuModel: "RTX4090" }, healthScore: 92, occupant: null },
  { id: 2, name: "gpu-02", status: "IN_USE", spec: { cpuCores: 16, ramGb: 64, gpuModel: "RTX4090" }, healthScore: 88, occupant: "홍길동" },
];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/servers"]}>
      <Routes>
        <Route path="/servers" element={<ServerListPage />} />
        <Route path="/servers/:id/reserve" element={<div>예약 화면</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ServerListPage", () => {
  it("서버를 테이블에 그리고 가용 서버만 예약 버튼을 활성화한다", async () => {
    server.use(http.get(`${API}/servers`, () => HttpResponse.json({ servers: SERVERS })));
    renderPage();
    expect(await screen.findByText("gpu-01")).toBeInTheDocument();
    expect(screen.getByText("gpu-02")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "gpu-01 예약 신청" })).toBeEnabled(); // AVAILABLE
    expect(screen.getByRole("button", { name: "gpu-02 예약 신청" })).toBeDisabled(); // IN_USE
  });

  it("예약 버튼을 누르면 예약 화면으로 이동한다", async () => {
    server.use(http.get(`${API}/servers`, () => HttpResponse.json({ servers: SERVERS })));
    renderPage();
    await screen.findByText("gpu-01");
    await userEvent.click(screen.getByRole("button", { name: "gpu-01 예약 신청" }));
    expect(await screen.findByText("예약 화면")).toBeInTheDocument();
  });

  it("상태 필터 클릭 시 status 쿼리로 다시 요청한다", async () => {
    const urls: string[] = [];
    server.use(
      http.get(`${API}/servers`, ({ request }) => {
        urls.push(new URL(request.url).search);
        return HttpResponse.json({ servers: SERVERS });
      }),
    );
    renderPage();
    await screen.findByText("gpu-01");
    await userEvent.click(screen.getByRole("button", { name: "가용" }));
    await waitFor(() => expect(urls.some((u) => u.includes("status=AVAILABLE"))).toBe(true));
  });
});
