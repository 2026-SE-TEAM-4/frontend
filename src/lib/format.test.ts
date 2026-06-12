import { describe, it, expect } from "vitest";

import { statusLabel, statusBadgeClass, pct, healthClass } from "./format";

describe("format", () => {
  it("상태를 한글 라벨로", () => {
    expect(statusLabel("AVAILABLE")).toBe("가용");
    expect(statusLabel("IN_USE")).toBe("사용 중");
  });

  it("상태별 뱃지 클래스", () => {
    expect(statusBadgeClass("AVAILABLE")).toContain("b-ok");
    expect(statusBadgeClass("MAINTENANCE")).toContain("b-mnt");
  });

  it("null 사용률은 대시", () => {
    expect(pct(null)).toBe("—");
    expect(pct(41)).toBe("41");
  });

  it("건강점수 색 구간", () => {
    expect(healthClass(92)).toBe("h-ok");
    expect(healthClass(74)).toBe("h-md");
    expect(healthClass(40)).toBe("h-bad");
    expect(healthClass(null)).toBe("h-bad");
  });
});
