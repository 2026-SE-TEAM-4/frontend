import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { server } from "@/test/server";
import { MyReservationsPage } from "./MyReservationsPage";

const API = "http://localhost:8000";

const RESERVATIONS = [
  { id: 1, user_id: 1, server_id: 5, start_time: "2026-06-20T09:00:00Z", end_time: "2026-06-21T09:00:00Z", status: "RESERVED", created_at: "2026-06-12T00:00:00Z" },
  { id: 2, user_id: 1, server_id: 6, start_time: "2026-06-10T09:00:00Z", end_time: "2026-06-12T09:00:00Z", status: "IN_USE", created_at: "2026-06-10T00:00:00Z" },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <MyReservationsPage />
    </MemoryRouter>,
  );
}

describe("MyReservationsPage", () => {
  it("상태별 액션: 예약됨은 취소, 사용 중은 반납", async () => {
    server.use(http.get(`${API}/reservations`, () => HttpResponse.json(RESERVATIONS)));
    renderPage();
    await screen.findByText("서버 #5");
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "반납" })).toBeInTheDocument();
  });

  it("반납을 누르면 return 을 호출하고 목록을 다시 불러온다", async () => {
    let returned = false;
    server.use(
      http.get(`${API}/reservations`, () =>
        HttpResponse.json(
          returned
            ? [{ ...RESERVATIONS[1], status: "RETURNED" }, RESERVATIONS[0]]
            : RESERVATIONS,
        ),
      ),
      http.post(`${API}/reservations/2/return`, () => {
        returned = true;
        return HttpResponse.json({ id: 2, status: "RETURNED" });
      }),
    );
    renderPage();
    await screen.findByText("서버 #6");
    await userEvent.click(screen.getByRole("button", { name: "반납" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "반납" })).not.toBeInTheDocument());
  });
});
