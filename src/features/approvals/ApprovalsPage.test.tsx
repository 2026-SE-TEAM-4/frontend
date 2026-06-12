import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";

import { server } from "@/test/server";
import { ApprovalsPage } from "./ApprovalsPage";

const API = "http://localhost:8000";

const PENDING = [
  {
    id: 5,
    requester_id: 4,
    approver_id: null,
    server_id: 1,
    requested_start: "2026-06-20T09:00:00Z",
    requested_end: "2026-06-21T09:00:00Z",
    reason: "논문 실험",
    status: "PENDING",
    requested_at: "2026-06-12T00:00:00Z",
    decided_at: null,
    decided_by: null,
  },
];

describe("ApprovalsPage", () => {
  it("승인을 누르면 decision(APPROVED)을 호출하고 목록을 갱신한다", async () => {
    let decided: unknown = null;
    server.use(
      http.get(`${API}/approval-requests`, () => HttpResponse.json(decided ? [] : PENDING)),
      http.post(`${API}/approval-requests/5/decision`, async ({ request }) => {
        decided = await request.json();
        return HttpResponse.json({ id: 5, status: "APPROVED" });
      }),
    );
    render(
      <MemoryRouter>
        <ApprovalsPage />
      </MemoryRouter>,
    );
    await screen.findByText("논문 실험");
    await userEvent.click(screen.getByRole("button", { name: "승인" }));
    await waitFor(() => expect(decided).toMatchObject({ action: "APPROVED" }));
    await waitFor(() => expect(screen.getByText("대기 중인 요청이 없습니다.")).toBeInTheDocument());
  });
});
