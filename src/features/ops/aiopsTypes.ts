// AIOps 화면 전용 응답 타입. 공용 types/api.ts 는 건드리지 않고 페이지 폴더에서 관리한다.
// (백엔드 계약은 설계 문서 §② 와 엔드포인트 명세를 단일 출처로 한다.)

export type Severity = "INFO" | "WARNING" | "CRITICAL";
export type IncidentStatus = "OPEN" | "RESOLVED";
export type MetricKind = "CPU" | "MEM" | "NET" | "GPU";

export interface IncidentSummaryRow {
  id: number;
  severity: Severity;
  status: IncidentStatus;
  anomalyCount: number;
  serverIds: number[];
  startedAt: string;
  resolvedAt?: string | null;
}

export interface IncidentListResp {
  incidents: IncidentSummaryRow[];
  noiseReductionRate: number;
}

export interface Anomaly {
  id: number;
  serverId: number;
  metric: MetricKind;
  currentValue: number;
  mean: number;
  stddev: number;
  detectedAt: string;
}

export interface IncidentDetailResp {
  incident: IncidentSummaryRow;
  anomalies: Anomaly[];
}

export interface RootCause {
  cause: string;
  evidence: string;
}

export interface Recommendation {
  action: string;
  rationale: string;
}

export interface IncidentSummaryResp {
  incidentId: number;
  generatedAt: string;
  model: string;
  situation: string;
  rootCauses: RootCause[];
  recommendations: Recommendation[];
}

export interface MetricSeriesPoint {
  ts: string;
  cpu: number;
  mem: number;
  gpu: number | null;
  net: number;
}

export interface MetricSeriesResp {
  serverId: number;
  window: string;
  points: MetricSeriesPoint[];
}
