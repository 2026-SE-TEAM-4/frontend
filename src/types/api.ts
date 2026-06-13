export type Role = "STU" | "MGR" | "ADM";
export type ServerStatus = "AVAILABLE" | "RESERVED" | "IN_USE" | "MAINTENANCE";

export interface AuthUser {
  id: number;
  name: string;
  role: Role;
  teamId: number;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthUser;
}

export interface Me extends AuthUser {
  email: string;
  lockedUntil: string | null;
}

export interface Team {
  id: number;
  name: string;
  code: string;
}

export interface TeamListResponse {
  teams: Team[];
}

export interface ServerSpec {
  cpuCores: number;
  ramGb: number;
  gpuModel: string | null;
}

export interface LatestMetric {
  cpuUsage: number;
  memUsage: number;
  netUsage: number;
  gpuUsage: number | null;
  status: string;
  collectedAt: string;
}

export interface ServerDetailResponse {
  id: number;
  name: string;
  status: ServerStatus;
  spec: ServerSpec;
  healthScore: number | null;
  // 백엔드가 /servers/{id} 에서 함께 내려주는 부가 필드. 기존 소비자 호환을 위해 옵셔널.
  ip?: string | null;
  groupName?: string | null;
  occupant?: string | null;
  riskScore?: number | null;
  etaToRisk?: string | null;
  latestMetric?: LatestMetric | null;
}

export interface ServerListItem extends ServerDetailResponse {
  occupant: string | null;
  latestMetric: LatestMetric | null;
  // /servers 응답에서 함께 내려오는 부가 필드(없으면 화면에서 "—").
  ip?: string | null;
  groupName?: string | null;
  riskScore?: number | null;
  etaToRisk?: string | null;
}

export interface ServerListResponse {
  servers: ServerListItem[];
}

export interface ServerAlternative {
  id: number;
  name: string;
  spec: { cpuCores: number; ramGb: number };
}

export interface ServerAlternativeResponse {
  alternatives: ServerAlternative[];
}

export interface Reservation {
  id: number;
  user_id: number;
  server_id: number;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  message: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface ApprovalRequest {
  id: number;
  requester_id: number;
  approver_id: number | null;
  server_id: number;
  requested_start: string;
  requested_end: string;
  reason: string | null;
  status: string;
  requested_at: string;
  decided_at: string | null;
  decided_by: string | null;
}

export interface Quota {
  id: number;
  user_id: number;
  user_name: string;
  team_id: number;
  limit: number;
  used: number;
  version: number;
}

// --- 보안 관제(ADM) ---
export type SecurityEventType =
  | "LOGIN_FAILURE"
  | "ACCOUNT_LOCKED"
  | "ACCESS_DENIED"
  | "ADMIN_ACTION"
  | "AGENT_UNREACHABLE";

export type SecuritySeverity = "INFO" | "WARNING" | "CRITICAL";

export type SecurityAlertType = "BRUTE_FORCE" | "ACCESS_ABUSE" | "AGENT_DOWN" | "ADMIN_ABUSE";

export type SecurityAlertStatus = "OPEN" | "RESOLVED";

export interface SecurityEvent {
  id: number;
  eventType: SecurityEventType;
  severity: SecuritySeverity;
  actorId: number | null;
  sourceIp: string | null;
  identifier: string | null;
  targetType: string | null;
  targetId: string | null;
  detail: Record<string, unknown> | null;
  occurredAt: string;
}

export interface SecurityAlert {
  id: number;
  alertType: SecurityAlertType;
  severity: SecuritySeverity;
  status: SecurityAlertStatus;
  subject: string;
  eventCount: number;
  message: string;
  startedAt: string;
  resolvedAt: string | null;
  resolvedBy: number | null;
}

export interface SecuritySummary {
  todayEvents: number;
  openAlerts: number;
  criticalAlerts: number;
  bruteForceSuspects: number;
}

// --- 운영(ADM) ---
export interface OpsDashboard {
  scheduler: { ucId: string; lastRun: string | null; success: boolean; processed: number }[];
  metrics: { successRate: number; missing: string[] };
  autoActions: { reclaimed: number; expired: number; autoRejected: number };
  health: { 정상: number; 주의: number; 위험: number };
}

export interface AvailabilityRow {
  id: number;
  uptime: number;
  mtbf: number | null;
  mttr: number | null;
  riskBadge: boolean;
}
export interface AvailabilityResponse {
  servers: AvailabilityRow[];
  systemAvailability: number;
}

export interface Incident {
  id: number;
  severity: string;
  status: string;
  anomalyCount: number;
  serverIds: number[];
  startedAt: string;
  resolvedAt: string | null;
}
export interface IncidentListResponse {
  noiseReductionRate: number;
  incidents: Incident[];
}

export interface HealthTrendPoint {
  ts: string;
  healthScore: number;
}
export interface HealthTrend {
  serverId: number;
  healthScore: number | null;
  riskScore: number | null;
  trend: string;
  etaToRisk: string | null;
  history: HealthTrendPoint[];
  drivers: string[];
}
