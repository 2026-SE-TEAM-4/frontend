interface Factor {
  label: string;
  delta: number;
}

interface HealthBreakdownProps {
  score: number;
  factors: Factor[];
}

// 80 이상 초록, 60 이상 노랑, 그 아래 빨강. 헬스 산식의 밴드와 일치시킨다.
function bandColor(score: number): string {
  if (score >= 80) return "var(--g-grn)";
  if (score >= 60) return "var(--g-yel)";
  return "var(--g-red)";
}

export function HealthBreakdown({ score, factors }: HealthBreakdownProps) {
  const color = bandColor(score);

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span
          className="font-mono text-[30px] font-bold leading-none"
          style={{ color, fontVariantNumeric: "tabular-nums" }}
        >
          {score}
        </span>
        <span className="text-[13px] text-[var(--g-mut)]">/ 100</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {factors.length === 0 && (
          <p className="text-[12px] text-[var(--g-mut)]">감점 요인 없음</p>
        )}
        {factors.map((f) => (
          <div key={f.label} className="flex items-center justify-between text-[13px]">
            <span className="text-[var(--g-tx)]">{f.label}</span>
            <span
              className="font-mono font-semibold text-[var(--g-red)]"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {f.delta}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
