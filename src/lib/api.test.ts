import { describe, it, expect, vi, beforeEach } from "vitest";

import { ApiError, apiFetch } from "./api";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as Response);
}

describe("apiFetch", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("성공 응답의 JSON 을 반환한다", async () => {
    vi.stubGlobal("fetch", mockFetch(200, { ok: true }));
    const data = await apiFetch<{ ok: boolean }>("/health");
    expect(data.ok).toBe(true);
  });

  it("토큰이 있으면 Authorization 헤더를 붙인다", async () => {
    localStorage.setItem("sh_token", "tok123");
    const f = mockFetch(200, {});
    vi.stubGlobal("fetch", f);
    await apiFetch("/servers");
    const headers = (f.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok123");
  });

  it("4xx 는 ApiError(status,message) 로 던진다", async () => {
    vi.stubGlobal("fetch", mockFetch(409, { detail: "충돌" }));
    await expect(apiFetch("/reservations", { method: "POST" })).rejects.toMatchObject({
      status: 409,
      message: "충돌",
    } satisfies Partial<ApiError>);
  });
});
