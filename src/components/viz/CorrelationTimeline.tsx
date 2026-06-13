import type { StatusTone } from "./StatusChip";

interface Tick {
  posPct: number;
  tone: StatusTone;
}

interface Group {
  leftPct: number;
  rightPct: number;
  label: string;
}

interface CorrelationTimelineProps {
  ticks: Tick[];
  groups: Group[];
}

const TICK_COLOR: Record<StatusTone, string> = {
  ok: "var(--g-grn)",
  warn: "var(--g-yel)",
  crit: "var(--g-red)",
  info: "var(--g-blu)",
  maint: "var(--g-mut)",
  inuse: "var(--g-pur)",
};

// 이상 틱을 시간축에 찍고, 묶인 구간을 브래킷("N개 → INC")으로 표시한다.
export function CorrelationTimeline({ ticks, groups }: CorrelationTimelineProps) {
  return (
    <div className="pt-5">
      <div className="relative h-[28px]">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[var(--g-bd)]" />
        {ticks.map((t, i) => (
          <span
            key={i}
            className="absolute top-1/2 h-[14px] w-[2px] -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${t.posPct}%`, background: TICK_COLOR[t.tone] }}
          />
        ))}
      </div>

      <div className="relative mt-1 h-[22px]">
        {groups.map((g, i) => (
          <div
            key={i}
            className="absolute top-0"
            style={{ left: `${g.leftPct}%`, width: `${Math.max(0, g.rightPct - g.leftPct)}%` }}
          >
            <div className="h-[6px] border-x border-b border-[var(--g-acc)]" />
            <div className="mt-0.5 text-center text-[11px] font-semibold text-[var(--g-acc)]">
              {g.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
