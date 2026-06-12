import { pct } from "@/lib/format";

function Bar({ label, value }: { label: string; value: number | null }) {
  const width = value === null ? 0 : Math.min(100, Math.max(0, value));
  const tone = value === null ? "" : value >= 85 ? "bg-[var(--dng)]" : value >= 60 ? "bg-[var(--rsv)]" : "bg-[var(--acc)]";
  return (
    <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-[var(--mut)]">
      <b className="w-[26px] font-semibold text-[var(--text2)]">{label}</b>
      <span className="h-[5px] flex-1 overflow-hidden rounded-[3px] bg-[var(--soft2)]">
        <i className={`block h-full rounded-[3px] ${tone}`} style={{ width: `${width}%` }} />
      </span>
      <span className="w-5 text-right">{pct(value)}</span>
    </div>
  );
}

export function UsageBars({
  cpu,
  mem,
  gpu,
}: {
  cpu: number | null;
  mem: number | null;
  gpu: number | null;
}) {
  return (
    <div className="flex min-w-[100px] flex-col gap-[3px]">
      <Bar label="CPU" value={cpu} />
      <Bar label="MEM" value={mem} />
      <Bar label="GPU" value={gpu} />
    </div>
  );
}
