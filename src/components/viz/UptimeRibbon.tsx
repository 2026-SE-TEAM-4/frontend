export type DayState = "up" | "warn" | "down";

interface UptimeRibbonProps {
  days: DayState[];
}

const STATE_COLOR: Record<DayState, string> = {
  up: "var(--g-grn)",
  warn: "var(--g-yel)",
  down: "var(--g-red)",
};

const STATE_LABEL: Record<DayState, string> = {
  up: "정상",
  warn: "주의",
  down: "다운",
};

// 일자별 가동 상태를 얇은 세그먼트 한 줄로 보여준다.
export function UptimeRibbon({ days }: UptimeRibbonProps) {
  return (
    <div className="flex gap-[2px]" role="img" aria-label="일자별 가동 상태">
      {days.map((d, i) => (
        <div
          key={i}
          className="h-[26px] flex-1 rounded-[2px]"
          style={{ background: STATE_COLOR[d] }}
          title={`${i + 1}일차: ${STATE_LABEL[d]}`}
        />
      ))}
    </div>
  );
}
