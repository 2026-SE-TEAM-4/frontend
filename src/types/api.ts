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

export interface ServerDetailResponse {
  id: number;
  name: string;
  status: ServerStatus;
  spec: ServerSpec;
  healthScore: number | null;
}

export interface ServerListItem extends ServerDetailResponse {
  occupant: string | null;
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
