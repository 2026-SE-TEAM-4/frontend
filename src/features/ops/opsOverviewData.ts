import type { ServerListResponse, ServerStatus } from "@/types/api";
import type { StatusTone } from "@/components/viz";

// 페이지 전용 타입. src/types/api.ts 는 수정하지 않고 여기에 둔다.
// 백엔드 응답이 camelCase 라는 가정 하에 형태만 좁혀 받는다.

export interface OpsHeatmapResponse {
  metric: string;
  servers: number[];
  serverNames: string[];
  buckets: string[];
  // 0~100 사용률. 수집 누락 시 null 가능.
  cells: (number | null)[][];
}

// /servers 응답 항목. riskScore 등 부가 필드는 ServerListItem 에 옵셔널로 typed 되어 있다.
export type OpsServerItem = ServerListResponse["servers"][number];

const STATUS_TONE: Record<ServerStatus, StatusTone> = {
  AVAILABLE: "ok",
  RESERVED: "info",
  IN_USE: "inuse",
  MAINTENANCE: "maint",
};

const STATUS_LABEL: Record<ServerStatus, string> = {
  AVAILABLE: "정상",
  RESERVED: "예약",
  IN_USE: "사용중",
  MAINTENANCE: "점검",
};

export function statusTone(status: ServerStatus): StatusTone {
  return STATUS_TONE[status];
}

export function statusLabel(status: ServerStatus): string {
  return STATUS_LABEL[status];
}

// 헬스 점수 → 색 톤. >=80 정상, 60~79 주의, <60 위험.
export function healthTone(score: number | null): "ok" | "warn" | "crit" | "none" {
  if (score === null) return "none";
  if (score >= 80) return "ok";
  if (score >= 60) return "warn";
  return "crit";
}

// 위험순(헬스 낮을수록·리스크 높을수록 위로) 정렬. 원본 배열은 건드리지 않는다.
export function sortWorstFirst(servers: OpsServerItem[]): OpsServerItem[] {
  return [...servers].sort((a, b) => {
    const ha = a.healthScore ?? Number.POSITIVE_INFINITY;
    const hb = b.healthScore ?? Number.POSITIVE_INFINITY;
    if (ha !== hb) return ha - hb;
    const ra = a.riskScore ?? Number.NEGATIVE_INFINITY;
    const rb = b.riskScore ?? Number.NEGATIVE_INFINITY;
    return rb - ra;
  });
}

// 최신 메트릭이 수집된(OK) 서버만 평균에 포함한다.
export function averageMetric(
  servers: OpsServerItem[],
  pick: (m: NonNullable<OpsServerItem["latestMetric"]>) => number | null,
): number | null {
  const values: number[] = [];
  for (const s of servers) {
    const m = s.latestMetric;
    if (!m || m.status !== "OK") continue;
    const v = pick(m);
    if (v !== null && Number.isFinite(v)) values.push(v);
  }
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function countAvailable(servers: OpsServerItem[]): number {
  return servers.filter((s) => s.status === "AVAILABLE").length;
}

// Heatmap 컴포넌트는 number[][] 만 받으므로 null 셀은 0 으로 좁힌다.
export function normalizeCells(cells: (number | null)[][]): number[][] {
  return cells.map((row) => row.map((v) => (v === null ? 0 : v)));
}

// 버킷 ISO 타임스탬프 → "HH시" 같은 시각 라벨.
export function formatBucketHour(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return `${d.getHours()}시`;
}

const SEVERITY_TONE: Record<string, StatusTone> = {
  CRITICAL: "crit",
  HIGH: "crit",
  MAJOR: "crit",
  WARNING: "warn",
  MEDIUM: "warn",
  MINOR: "warn",
  LOW: "info",
  INFO: "info",
};

export function severityTone(severity: string): StatusTone {
  return SEVERITY_TONE[severity.toUpperCase()] ?? "info";
}

export const UC_DESC: Record<string, string> = {
  UC13: "점검 전환",
  UC14: "메트릭 수집",
  UC15: "유휴 회수",
  UC16: "예약 전이",
  UC17: "승인 타임아웃",
  UC18: "이상탐지",
  UC19: "건강점수",
  UC22: "수요 예측",
  UC23: "장애 예측",
  UC24: "인시던트 상관",
  UC25: "인시던트 요약",
};
