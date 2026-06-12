import type { ServerStatus } from "@/types/api";

const cls: Record<ServerStatus, string> = {
  AVAILABLE: "bg-[var(--oks)] text-[#0f5132]",
  IN_USE: "bg-[var(--uses)] text-[var(--acct)]",
  RESERVED: "bg-[var(--rsvs)] text-[#664d03]",
  MAINTENANCE: "bg-[var(--mnts)] text-[var(--mut)]",
};

export function StatusBadge({ status }: { status: ServerStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-bold ${cls[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
