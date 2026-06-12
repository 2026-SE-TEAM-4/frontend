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
