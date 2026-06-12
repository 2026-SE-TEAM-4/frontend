import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { server } from "@/test/server";
import { AlertsPage } from "./AlertsPage";

const API = "http://localhost:8000";

const NOTIFS = [
  { id: 1, user_id: 1, type: "APPROVAL", message: "예약이 승인되었습니다", payload: null, read_at: null, created_at: "2026-06-12T00:00:00Z" },
  { id: 2, user_id: 1, type: "EXPIRY", message: "예약이 곧 만료됩니다", payload: null, read_at: "2026-06-11T00:00:00Z", created_at: "2026-06-11T00:00:00Z" },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <AlertsPage />
    </MemoryRouter>,
  );
}

describe("AlertsPage", () => {
  it("안읽은 알림에만 읽음 버튼이 있고, 누르면 PATCH 후 사라진다", async () => {
    let read = false;
    server.use(
      http.get(`${API}/notifications`, () =>
        HttpResponse.json(read ? [{ ...NOTIFS[0], read_at: "2026-06-12T01:00:00Z" }, NOTIFS[1]] : NOTIFS),
      ),
      http.patch(`${API}/notifications/1/read`, () => {
        read = true;
        return HttpResponse.json({ ...NOTIFS[0], read_at: "2026-06-12T01:00:00Z" });
      }),
    );
    renderPage();
    await screen.findByText("예약이 승인되었습니다");
    expect(screen.getAllByRole("button", { name: "읽음" })).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "읽음" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "읽음" })).not.toBeInTheDocument());
  });
});
