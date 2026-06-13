// 서버 상세 페이지 전용 타입·변환 로직.
// 메트릭/이상/예측 응답 타입은 여기서 로컬로 선언한다.
import type { MetricPoint } from "@/components/viz";
import type { LatestMetric } from "@/types/api";

// GET /servers/{id}/metrics?window= → 버킷 평균 시계열. gpu 는 미탑재 노드에서 null.
export interface MetricSeriesPoint {
  ts: string;
  cpu: number;
  mem: number;
  net: number;
  gpu: number | null;
}
export interface ServerMetricSeries {
  serverId: number;
  window: string;
  points: MetricSeriesPoint[];
}

// GET /servers/{id}/anomalies?window= → 최근 이상 목록 (MGR/ADM).
export interface ServerAnomaly {
  id: number;
  metric: string;
  currentValue: number;
  mean: number;
  stddev: number;
  detectedAt: string;
}

// GET /ops/forecast?serverId=&metric= → 용량 예측 (MGR/ADM).
export interface ForecastHorizonPoint {
  ts: string;
  yhat: number;
  lower: number;
  upper: number;
}
export interface ForecastResponse {
  serverId: number | null;
  metric: string;
  generatedAt: string;
  saturationAt: string | null;
  confidence: number;
  horizon: ForecastHorizonPoint[];
}

type MetricKey = "cpu" | "gpu" | "mem" | "net";

// 현재 사용률 한 점 형태. 시계열 마지막 버킷과 상세 응답 latestMetric 공용.
export interface UsagePoint {
  cpu: number;
  mem: number;
  net: number;
  gpu: number | null;
}

// 상세 응답의 latestMetric(camelCase) 을 현재 사용률 점 형태로 변환한다.
export function toUsagePoint(metric: LatestMetric): UsagePoint {
  return { cpu: metric.cpuUsage, mem: metric.memUsage, net: metric.netUsage, gpu: metric.gpuUsage };
}

// 한 메트릭 채널을 MetricTimeSeries 가 받는 {ts, value} 형태로 추린다.
// gpu 가 null 인 점은 차트에서 제외한다(미탑재 노드).
export function toSeries(points: MetricSeriesPoint[], key: MetricKey): MetricPoint[] {
  return points
    .filter((p) => p[key] !== null)
    .map((p) => ({ ts: shortTime(p.ts), value: p[key] as number }));
}

// 이상 마커를 같은 시간축(짧은 라벨)에 맞춰 정렬한다.
export function toAnomalyMarkers(anomalies: ServerAnomaly[], metric: MetricKey): { ts: string; value: number }[] {
  return anomalies
    .filter((a) => a.metric.toLowerCase() === metric)
    .map((a) => ({ ts: shortTime(a.detectedAt), value: a.currentValue }));
}

// HealthTrend.history 를 헬스 추세 차트용 {ts, value} 로 바꾼다.
export function toHealthSeries(history: { ts: string; healthScore: number }[]): MetricPoint[] {
  return history.map((h) => ({ ts: shortDate(h.ts), value: h.healthScore }));
}

// 예측 history 는 메트릭 관측점, forecast 는 horizon 으로 ForecastCorridor 에 넘긴다.
export function toForecastHistory(points: MetricSeriesPoint[], key: MetricKey): { ts: string; value: number }[] {
  return points
    .filter((p) => p[key] !== null)
    .map((p) => ({ ts: shortTime(p.ts), value: p[key] as number }));
}
export function toForecastFuture(horizon: ForecastHorizonPoint[]): ForecastHorizonPoint[] {
  return horizon.map((h) => ({ ts: shortTime(h.ts), yhat: h.yhat, lower: h.lower, upper: h.upper }));
}

// 헬스 감점 분해. 백엔드 산식을 클라이언트에서 그대로 미러링한다.
// factor breakdown mirrors backend app/services/health.py — keep in sync.
// (수집 누락률은 응답에 노출되지 않으므로 해당 감점은 생략한다.)
const USAGE_FLOOR = 60;
const CPU_WEIGHT = 0.4;
const MEM_WEIGHT = 0.4;
const GPU_WEIGHT = 0.3;
const ANOMALY_PER_EVENT = 3;
const ANOMALY_CAP = 30;

function usagePenalty(usage: number, weight: number): number {
  return Math.max(0, usage - USAGE_FLOOR) * weight;
}

export function healthFactors(
  latest: { cpu: number; mem: number; gpu: number | null } | null,
  anomalyCount24h: number,
): { label: string; delta: number }[] {
  const factors: { label: string; delta: number }[] = [];
  if (latest) {
    const cpu = usagePenalty(latest.cpu, CPU_WEIGHT);
    const mem = usagePenalty(latest.mem, MEM_WEIGHT);
    if (cpu > 0) factors.push({ label: "CPU 과사용", delta: -round1(cpu) });
    if (mem > 0) factors.push({ label: "MEM 과사용", delta: -round1(mem) });
    if (latest.gpu !== null) {
      const gpu = usagePenalty(latest.gpu, GPU_WEIGHT);
      if (gpu > 0) factors.push({ label: "GPU 과사용", delta: -round1(gpu) });
    }
  }
  const anomalyPenalty = Math.min(ANOMALY_CAP, anomalyCount24h * ANOMALY_PER_EVENT);
  if (anomalyPenalty > 0) {
    factors.push({ label: `최근 24h 이상 ${anomalyCount24h}건`, delta: -anomalyPenalty });
  }
  return factors;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// 차트 라벨용 시각 포맷. 자릿수 정렬되는 짧은 HH:MM.
function shortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}/${p(d.getDate())}`;
}
