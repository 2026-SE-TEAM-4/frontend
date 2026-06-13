export type DeltaTone = "up" | "down" | "neutral";

interface KpiTileProps {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaTone?: DeltaTone;
}

const DELTA_COLOR: Record<DeltaTone, string> = {
  up: "var(--g-grn)",
  down: "var(--g-red)",
  neutral: "var(--g-mut)",
};

export function KpiTile({ label, value, unit, delta, deltaTone = "neutral" }: KpiTileProps) {
  return (
    <div className="rounded-lg border border-[var(--g-bd)] bg-[var(--g-pan)] px-4 py-3">
      <div className="text-[12px] text-[var(--g-mut)]">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span
          className="font-mono text-[28px] font-bold leading-none text-[var(--g-tx)]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {unit && <span className="text-[13px] text-[var(--g-mut)]">{unit}</span>}
      </div>
      {delta && (
        <div
          className="mt-1.5 font-mono text-[12px] font-semibold"
          style={{ color: DELTA_COLOR[deltaTone], fontVariantNumeric: "tabular-nums" }}
        >
          {delta}
        </div>
      )}
    </div>
  );
}
