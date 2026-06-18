import { Fragment } from "react";

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

      {/* 브래킷(구간 표시)과 라벨을 분리한다. 라벨을 구간 폭(0일 수 있음)에 가두면
          글자가 세로로 줄바꿈되며 레이아웃이 깨지므로, 라벨은 구간 중앙에 nowrap 으로
          따로 띄우고 위치를 8~92%로 제한해 가장자리에서 잘리지 않게 한다. */}
      <div className="relative mt-1 h-[24px]">
        {groups.map((g, i) => {
          const width = Math.max(0, g.rightPct - g.leftPct);
          const mid = g.leftPct + width / 2;
          const labelPct = Math.min(92, Math.max(8, mid));
          return (
            <Fragment key={i}>
              <div
                className="absolute top-0 h-[6px] border-x border-b border-[var(--g-acc)]"
                style={{ left: `${g.leftPct}%`, width: `${width}%` }}
              />
              <span
                className="absolute top-[9px] -translate-x-1/2 whitespace-nowrap text-[11px] font-semibold text-[var(--g-acc)]"
                style={{ left: `${labelPct}%` }}
              >
                {g.label}
              </span>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
