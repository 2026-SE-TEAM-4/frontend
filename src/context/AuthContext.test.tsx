import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AuthProvider, useAuth } from "./AuthContext";

function Probe() {
  const { user, login } = useAuth();
  return (
    <div>
      <span>user:{user?.name ?? "none"}</span>
      <button onClick={() => login("a@b.com", "password123")}>go</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => localStorage.clear());

  it("login 성공 시 user 를 채우고 토큰을 저장한다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            accessToken: "t1",
            tokenType: "bearer",
            expiresIn: 3600,
            user: { id: 1, name: "홍길동", role: "STU", teamId: 1 },
          }),
      } as Response),
    );
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await userEvent.click(screen.getByText("go"));
    await waitFor(() => expect(screen.getByText("user:홍길동")).toBeInTheDocument());
    expect(localStorage.getItem("sh_token")).toBe("t1");
  });
});
