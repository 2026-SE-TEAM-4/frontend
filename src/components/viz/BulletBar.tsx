interface BulletBarProps {
  value: number;
  threshold?: number;
  unit?: string;
}

// 게이지/도넛 대신 막대로 사용률을 표현한다. 임계치에 가까우면 노랑, 넘으면 빨강.
function bandColor(value: number, threshold: number): string {
  if (value >= threshold) return "var(--g-red)";
  if (value >= threshold - 15) return "var(--g-yel)";
  return "var(--g-grn)";
}

export function BulletBar({ value, threshold = 80, unit = "%" }: BulletBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  const fill = bandColor(value, threshold);

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-[10px] flex-1 overflow-hidden rounded-[3px] bg-[var(--g-pan2)] ring-1 ring-inset ring-[var(--g-bd)]">
        <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: fill }} />
        <div
          className="absolute top-[-2px] h-[14px] w-[2px] bg-[var(--g-tx)] opacity-60"
          style={{ left: `${Math.min(100, threshold)}%` }}
          title={`임계 ${threshold}${unit}`}
        />
      </div>
      <span
        className="w-[44px] shrink-0 text-right font-mono text-[12px] text-[var(--g-tx)]"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {value.toFixed(0)}
        {unit}
      </span>
    </div>
  );
}
