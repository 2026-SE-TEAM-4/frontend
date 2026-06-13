import type { DayState } from "@/components/viz";

// 가용성 리본의 세그먼트 수. 30개로 한 달(30일) 느낌을 주되, 실제 일자 이벤트가 아니라
// 가동률을 비율로 환산한 근사 표현임을 페이지 캡션에서 명시한다.
export const RIBBON_SEGMENTS = 30;

// 백엔드 /ops/availability 는 서버별 누적 가동률(uptime %)만 주고 일자별 이력은 주지 않는다.
// 따라서 정직한 근사로, 가동률에서 도출한 (100 - uptime)% 만큼의 세그먼트를 다운/주의로 칠한다.
// 이것은 "며칠에 무슨 일이 있었나"가 아니라 "전체 중 얼마나 비가동이었나"를 보여주는 비율 요약이다.
// 90% 미만 비가동분은 다운(빨강), 그 위 경계 구간은 주의(노랑)로 나눠 단조로움을 피한다.
export function deriveRibbonFromUptime(uptime: number): DayState[] {
  const clamped = Math.max(0, Math.min(100, uptime));
  const downGoal = Math.round(((100 - clamped) / 100) * RIBBON_SEGMENTS);

  // 비가동분의 약 1/3 은 "주의"(완전 다운은 아닌 열화)로 두어 상태를 두 단계로 나눈다.
  const warnCount = Math.round(downGoal / 3);
  const downCount = downGoal - warnCount;

  const segments: DayState[] = [];
  for (let i = 0; i < RIBBON_SEGMENTS; i += 1) {
    if (i < downCount) segments.push("down");
    else if (i < downCount + warnCount) segments.push("warn");
    else segments.push("up");
  }
  return segments;
}
