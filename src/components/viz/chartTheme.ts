// recharts는 CSS 변수를 일부 prop에서 직접 못 읽으므로, 차트 공통 색/여백을
// 한곳에서 관리한다. 모든 색은 --g- 토큰을 가리키므로 테마에 따라 바뀐다.
export const CHART = {
  grid: "var(--g-bd)",
  axis: "var(--g-mut)",
  line: "var(--g-blu)",
  band: "var(--g-blu)",
  threshold: "var(--g-red)",
  anomaly: "var(--g-red)",
  forecast: "var(--g-acc)",
  now: "var(--g-mut)",
  text: "var(--g-tx)",
} as const;

export const AXIS_TICK = { fontSize: 12, fill: "var(--g-mut)", fontFamily: "var(--mono)" };

export const TOOLTIP_STYLE = {
  background: "var(--g-pan)",
  border: "1px solid var(--g-bd)",
  borderRadius: 6,
  fontSize: 12,
  color: "var(--g-tx)",
} as const;
