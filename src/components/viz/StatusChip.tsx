export type StatusTone = "ok" | "warn" | "crit" | "info" | "maint" | "inuse";

interface StatusChipProps {
  tone: StatusTone;
  label: string;
}

// 색만으로 상태를 전달하지 않도록 항상 점(색) + 라벨(텍스트)을 함께 렌더한다.
const TONE: Record<StatusTone, { dot: string; bg: string; bd: string; tx: string }> = {
  ok: { dot: "var(--g-grn)", bg: "var(--g-pan2)", bd: "var(--g-grnbd)", tx: "var(--g-grn)" },
  warn: { dot: "var(--g-yel)", bg: "var(--g-pan2)", bd: "var(--g-yelbd)", tx: "var(--g-yel)" },
  crit: { dot: "var(--g-red)", bg: "var(--g-pan2)", bd: "var(--g-redbd)", tx: "var(--g-red)" },
  info: { dot: "var(--g-blu)", bg: "var(--g-pan2)", bd: "var(--g-bd)", tx: "var(--g-blu)" },
  maint: { dot: "var(--g-mut)", bg: "var(--g-pan2)", bd: "var(--g-bd)", tx: "var(--g-mut)" },
  inuse: { dot: "var(--g-pur)", bg: "var(--g-purbg)", bd: "var(--g-bd)", tx: "var(--g-pur)" },
};

export function StatusChip({ tone, label }: StatusChipProps) {
  const c = TONE[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[12px] font-semibold"
      style={{ background: c.bg, borderColor: c.bd, color: c.tx }}
    >
      <span className="h-[7px] w-[7px] rounded-full" style={{ background: c.dot }} />
      {label}
    </span>
  );
}
