interface HeatmapProps {
  rows: string[];
  cols: string[];
  cells: number[][];
  legend?: boolean;
  unit?: string;
}

// 값(0~100)을 옅은 회색 → 초록 → 노랑 → 빨강으로 매핑한다.
function cellColor(v: number): string {
  if (v >= 85) return "var(--g-red)";
  if (v >= 70) return "var(--g-yel)";
  if (v >= 40) return "var(--g-grn)";
  if (v >= 15) return "var(--g-grnbd)";
  return "var(--g-pan2)";
}

export function Heatmap({ rows, cols, cells, legend = true, unit = "%" }: HeatmapProps) {
  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `minmax(96px, max-content) repeat(${cols.length}, 1fr)` }}
      >
        <div />
        {cols.map((c, ci) => (
          <div key={ci} className="text-center text-[10px] text-[var(--g-mut)]">
            {c}
          </div>
        ))}

        {rows.map((row, ri) => (
          <RowCells key={ri} row={row} values={cells[ri] ?? []} unit={unit} />
        ))}
      </div>

      {legend && (
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[var(--g-mut)]">
          <span>낮음</span>
          {["var(--g-pan2)", "var(--g-grnbd)", "var(--g-grn)", "var(--g-yel)", "var(--g-red)"].map(
            (c) => (
              <span
                key={c}
                className="h-[12px] w-[18px] rounded-[2px] ring-1 ring-inset ring-[var(--g-bd)]"
                style={{ background: c }}
              />
            ),
          )}
          <span>높음</span>
        </div>
      )}
    </div>
  );
}

function RowCells({ row, values, unit }: { row: string; values: number[]; unit: string }) {
  return (
    <>
      <div className="flex items-center truncate pr-2 text-[12px] text-[var(--g-tx)]">{row}</div>
      {values.map((v, ci) => (
        <div
          key={ci}
          className="h-[22px] rounded-[2px]"
          style={{ background: cellColor(v) }}
          title={`${row} · ${v.toFixed(0)}${unit}`}
        />
      ))}
    </>
  );
}
