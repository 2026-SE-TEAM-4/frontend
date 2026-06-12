import type { ServerStatus } from "@/types/api";

const LABEL: Record<ServerStatus, string> = {
  AVAILABLE: "가용",
  RESERVED: "예약됨",
  IN_USE: "사용 중",
  MAINTENANCE: "점검",
};

const BADGE: Record<ServerStatus, string> = {
  AVAILABLE: "b-ok",
  RESERVED: "b-rsv",
  IN_USE: "b-use",
  MAINTENANCE: "b-mnt",
};

export function statusLabel(status: ServerStatus): string {
  return LABEL[status];
}

export function statusBadgeClass(status: ServerStatus): string {
  return `bdg ${BADGE[status]}`;
}

export function pct(value: number | null): string {
  return value === null ? "—" : String(Math.round(value));
}

export function healthClass(value: number | null): string {
  if (value === null) return "h-bad";
  if (value >= 85) return "h-ok";
  if (value >= 60) return "h-md";
  return "h-bad";
}

export function formatRange(startIso: string, endIso: string): string {
  const fmt = (iso: string) => {
    const d = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  };
  return `${fmt(startIso)} ~ ${fmt(endIso)}`;
}
