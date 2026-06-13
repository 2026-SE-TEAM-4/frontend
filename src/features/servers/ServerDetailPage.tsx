import type { ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import {
  BulletBar,
  ForecastCorridor,
  HealthBreakdown,
  KpiTile,
  MetricTimeSeries,
  Panel,
  StatusChip,
  Tabs,
} from "@/components/viz";
import type { StatusTone } from "@/components/viz";
import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { useApi } from "@/hooks/useApi";
import { statusLabel } from "@/lib/format";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import type { HealthTrend, ServerDetailResponse, ServerStatus } from "@/types/api";

import {
  healthFactors,
  toAnomalyMarkers,
  toForecastFuture,
  toForecastHistory,
  toHealthSeries,
  toSeries,
  toUsagePoint,
} from "./serverDetailData";
import type { ForecastResponse, ServerAnomaly, ServerMetricSeries, UsagePoint } from "./serverDetailData";

const STATUS_TONE: Record<ServerStatus, StatusTone> = {
  AVAILABLE: "ok",
  RESERVED: "info",
  IN_USE: "inuse",
  MAINTENANCE: "maint",
};

const TREND_LABEL: Record<string, string> = {
  IMPROVING: "개선 중",
  STABLE: "안정",
  DEGRADING: "열화 중",
};
const TREND_TONE: Record<string, StatusTone> = {
  IMPROVING: "ok",
  STABLE: "info",
  DEGRADING: "crit",
};

const GPU_THRESHOLD = 90;

export function ServerDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canSeeOps = user?.role === "MGR" || user?.role === "ADM";

  const detail = useApi<ServerDetailResponse>(`/servers/${id}`, 10_000);
  const metrics = useApi<ServerMetricSeries>(`/servers/${id}/metrics?window=6h`, 30_000);
  const trend = useApi<HealthTrend>(canSeeOps ? `/servers/${id}/health-trend` : null, 30_000);
  const anomalies24h = useApi<ServerAnomaly[]>(canSeeOps ? `/servers/${id}/anomalies?window=24h` : null, 60_000);
  const anomalies6h = useApi<ServerAnomaly[]>(canSeeOps ? `/servers/${id}/anomalies?window=6h` : null, 60_000);
  const forecast = useApi<ForecastResponse>(canSeeOps ? `/ops/forecast?serverId=${id}&metric=GPU` : null, 60_000);

  const server = detail.data;

  if (detail.loading && !server) {
    return (
      <div>
        <DetailTraceBar />
        <Spinner />
      </div>
    );
  }

  if (detail.error || !server) {
    return (
      <div>
        <DetailTraceBar />
        <Notice tone="error">서버를 불러오지 못했습니다. {detail.error?.message ?? ""}</Notice>
      </div>
    );
  }

  const points = metrics.data?.points ?? [];
  // 현재 사용률은 상세 응답의 latestMetric 을 우선 사용하고, 없으면 메트릭 시계열의 마지막 버킷으로 폴백한다.
  const latestPoint: UsagePoint | null = server.latestMetric
    ? toUsagePoint(server.latestMetric)
    : points.length > 0
      ? points[points.length - 1]
      : null;
  const anomalyCount24h = anomalies24h.data?.length ?? 0;
  const status = server.status as ServerStatus;

  return (
    <div>
      <DetailTraceBar />

      <PageHead
        title={server.name}
        actions={
          status === "AVAILABLE" ? (
            <Link to={`/servers/${server.id}/reserve`}>
              <Button variant="pri">예약</Button>
            </Link>
          ) : undefined
        }
      />

      <div className="mb-4">
        <SpecChips
          status={status}
          cpuCores={server.spec.cpuCores}
          ramGb={server.spec.ramGb}
          gpuModel={server.spec.gpuModel}
          ip={server.ip ?? null}
          groupName={server.groupName ?? null}
          occupant={server.occupant ?? null}
        />
      </div>

      <Tabs
        tabs={[
          { key: "overview", label: "종합" },
          { key: "ai", label: "AI 진단" },
        ]}
        defaultValue="overview"
      >
        {{
          overview: (
            <OverviewTab
              canSeeOps={canSeeOps}
              healthScore={server.healthScore}
              latestPoint={latestPoint}
              anomalyCount24h={anomalyCount24h}
              metrics={metrics}
              points={points}
              anomalies6h={anomalies6h.data ?? []}
              anomalies24h={anomalies24h.data ?? []}
              trend={trend.data}
              forecast={forecast.data}
            />
          ),
          ai: (
            <AiTab
              canSeeOps={canSeeOps}
              healthScore={server.healthScore}
              latestPoint={latestPoint}
              anomalyCount24h={anomalyCount24h}
              trend={trend.data}
            />
          ),
        }}
      </Tabs>
    </div>
  );
}

function DetailTraceBar() {
  return (
    <TraceBar
      screen="서버 상세 (S3)"
      api="GET /servers/{id} · /metrics · /health-trend · /anomalies · /ops/forecast"
      feature="F02 · UC23"
      uc="UC01 · UC22 · UC23"
      entity="Server · ServerMetric · AnomalyRecord · Forecast"
    />
  );
}

interface SpecChipsProps {
  status: ServerStatus;
  cpuCores: number;
  ramGb: number;
  gpuModel: string | null;
  ip: string | null;
  groupName: string | null;
  occupant: string | null;
}

function SpecChips({ status, cpuCores, ramGb, gpuModel, ip, groupName, occupant }: SpecChipsProps) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <StatusChip tone={STATUS_TONE[status]} label={statusLabel(status)} />
      <Chip>{cpuCores} vCPU</Chip>
      <Chip>{ramGb} GB</Chip>
      {gpuModel && <Chip>{gpuModel}</Chip>}
      {ip && <Chip>{ip}</Chip>}
      {groupName && <Chip>그룹 {groupName}</Chip>}
      {occupant && <Chip>점유자 {occupant}</Chip>}
    </span>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      className="rounded-full border border-[var(--g-bd)] bg-[var(--g-pan2)] px-2.5 py-0.5 font-mono text-[12px] text-[var(--g-tx)]"
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {children}
    </span>
  );
}

type MetricsState = ReturnType<typeof useApi<ServerMetricSeries>>;

interface OverviewTabProps {
  canSeeOps: boolean;
  healthScore: number | null;
  latestPoint: { cpu: number; mem: number; net: number; gpu: number | null } | null;
  anomalyCount24h: number;
  metrics: MetricsState;
  points: ServerMetricSeries["points"];
  anomalies6h: ServerAnomaly[];
  anomalies24h: ServerAnomaly[];
  trend: HealthTrend | null;
  forecast: ForecastResponse | null;
}

function OverviewTab({
  canSeeOps,
  healthScore,
  latestPoint,
  anomalyCount24h,
  metrics,
  points,
  anomalies6h,
  anomalies24h,
  trend,
  forecast,
}: OverviewTabProps) {
  const gpuSeries = toSeries(points, "gpu");
  const gpuMarkers = toAnomalyMarkers(anomalies6h, "gpu");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel title="현재 사용률" sub="최근 수집 버킷 기준">
        {latestPoint ? (
          <div className="space-y-3">
            <UsageRow label="CPU" value={latestPoint.cpu} />
            <UsageRow label="GPU" value={latestPoint.gpu} />
            <UsageRow label="MEM" value={latestPoint.mem} />
            <UsageRow label="NET" value={latestPoint.net} />
          </div>
        ) : (
          <EmptyHint loading={metrics.loading} error={!!metrics.error} kind="metric" />
        )}
      </Panel>

      <Panel title="헬스 분해" sub="감점 요인을 백엔드 산식대로 보여준다">
        {healthScore !== null ? (
          <HealthBreakdown score={healthScore} factors={healthFactors(latestPoint, anomalyCount24h)} />
        ) : (
          <p className="text-[13px] text-[var(--g-mut)]">건강 점수가 아직 산출되지 않았습니다.</p>
        )}
      </Panel>

      <Panel title="위험 · 예측" sub={canSeeOps ? "EWMA 기반 위험도와 용량 예측" : undefined}>
        {!canSeeOps ? (
          <RoleHint />
        ) : (
          <RiskPredictBlock trend={trend} forecast={forecast} history={points} />
        )}
      </Panel>

      <div className="lg:col-span-2">
        <Panel title="GPU 사용률 추세" sub="최근 6시간 · 임계 90%">
          {gpuSeries.length > 0 ? (
            <MetricTimeSeries data={gpuSeries} threshold={GPU_THRESHOLD} anomalies={gpuMarkers} unit="%" height={240} />
          ) : (
            <EmptyHint loading={metrics.loading} error={!!metrics.error} kind="metric" />
          )}
        </Panel>
      </div>

      <Panel title="최근 이상" sub="최근 24시간">
        {!canSeeOps ? (
          <RoleHint />
        ) : (
          <AnomalyList anomalies={anomalies24h} loading={false} error={false} />
        )}
      </Panel>
    </div>
  );
}

interface AiTabProps {
  canSeeOps: boolean;
  healthScore: number | null;
  latestPoint: { cpu: number; mem: number; net: number; gpu: number | null } | null;
  anomalyCount24h: number;
  trend: HealthTrend | null;
}

function AiTab({ canSeeOps, healthScore, latestPoint, anomalyCount24h, trend }: AiTabProps) {
  if (!canSeeOps) {
    return (
      <Panel title="AI 진단" sub="MGR · ADM 전용">
        <RoleHint />
      </Panel>
    );
  }

  const healthSeries = trend ? toHealthSeries(trend.history) : [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel title="헬스 분해">
        {healthScore !== null ? (
          <HealthBreakdown score={healthScore} factors={healthFactors(latestPoint, anomalyCount24h)} />
        ) : (
          <p className="text-[13px] text-[var(--g-mut)]">건강 점수가 아직 산출되지 않았습니다.</p>
        )}
      </Panel>

      <div className="lg:col-span-2">
        <Panel title="위험 진단" sub="추세 · ETA · 근거">
          {trend ? <RiskDiagnosis trend={trend} /> : <p className="text-[13px] text-[var(--g-mut)]">추세 데이터가 없습니다.</p>}
        </Panel>
      </div>

      <div className="lg:col-span-3">
        <Panel title="헬스 7일 추세" sub="저장된 건강 점수 이력">
          {healthSeries.length > 0 ? (
            <MetricTimeSeries data={healthSeries} anomalies={etaMarker(trend, healthSeries)} unit="" height={260} />
          ) : (
            <p className="text-[13px] text-[var(--g-mut)]">건강 이력이 아직 충분하지 않습니다.</p>
          )}
        </Panel>
      </div>
    </div>
  );
}

function UsageRow({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="mb-1 text-[12px] text-[var(--g-mut)]">{label}</div>
      {value === null ? (
        <span className="text-[13px] text-[var(--g-mut)]">미탑재</span>
      ) : (
        <BulletBar value={value} threshold={label === "GPU" ? GPU_THRESHOLD : 80} />
      )}
    </div>
  );
}

interface RiskPredictBlockProps {
  trend: HealthTrend | null;
  forecast: ForecastResponse | null;
  history: ServerMetricSeries["points"];
}

function RiskPredictBlock({ trend, forecast, history }: RiskPredictBlockProps) {
  return (
    <div className="space-y-4">
      {trend ? (
        <div className="grid grid-cols-2 gap-3">
          <KpiTile label="위험 점수" value={trend.riskScore ?? "—"} />
          <KpiTile
            label="추세"
            value={TREND_LABEL[trend.trend] ?? trend.trend}
            delta={trend.etaToRisk ? `ETA ${formatEta(trend.etaToRisk)}` : undefined}
            deltaTone={trend.trend === "DEGRADING" ? "down" : "neutral"}
          />
        </div>
      ) : (
        <p className="text-[13px] text-[var(--g-mut)]">위험 데이터가 없습니다.</p>
      )}

      {forecast && forecast.horizon.length > 0 ? (
        <div>
          <div className="mb-1.5 text-[12px] text-[var(--g-mut)]">GPU 용량 예측 (포화 임계 90%)</div>
          <ForecastCorridor
            history={toForecastHistory(history, "gpu")}
            forecast={toForecastFuture(forecast.horizon)}
            threshold={GPU_THRESHOLD}
            saturationLabel={forecast.saturationAt ? `포화 ${formatEta(forecast.saturationAt)}` : "임계 90%"}
            height={200}
          />
        </div>
      ) : (
        <p className="text-[12px] text-[var(--g-mut)]">아직 생성된 용량 예측이 없습니다.</p>
      )}
    </div>
  );
}

function RiskDiagnosis({ trend }: { trend: HealthTrend }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip tone={TREND_TONE[trend.trend] ?? "info"} label={TREND_LABEL[trend.trend] ?? trend.trend} />
        <div>
          <span className="text-[12px] text-[var(--g-mut)]">위험 점수 </span>
          <span className="font-mono text-[18px] font-bold text-[var(--g-tx)]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {trend.riskScore ?? "—"}
          </span>
        </div>
        <div>
          <span className="text-[12px] text-[var(--g-mut)]">위험 도달 ETA </span>
          <span className="font-mono text-[15px] font-semibold text-[var(--g-tx)]">
            {trend.etaToRisk ? formatEta(trend.etaToRisk) : "—"}
          </span>
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-[12px] font-semibold text-[var(--g-mut)]">근거</div>
        {trend.drivers.length > 0 ? (
          <ul className="space-y-1.5">
            {trend.drivers.map((d, i) => (
              <li key={i} className="flex gap-2 text-[14px] text-[var(--g-tx)]">
                <span className="mt-[7px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--g-acc)]" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-[var(--g-mut)]">근거 항목이 없습니다.</p>
        )}
      </div>
    </div>
  );
}

function AnomalyList({ anomalies }: { anomalies: ServerAnomaly[]; loading: boolean; error: boolean }) {
  if (anomalies.length === 0) {
    return <p className="text-[13px] text-[var(--g-mut)]">최근 24시간 내 이상이 없습니다.</p>;
  }
  return (
    <ul className="space-y-2">
      {anomalies.map((a) => (
        <li key={a.id} className="flex items-baseline justify-between gap-3 border-b border-[var(--g-bd)] pb-2 last:border-0">
          <div>
            <span className="font-mono text-[13px] font-semibold uppercase text-[var(--g-tx)]">{a.metric}</span>
            <span className="ml-2 text-[12px] text-[var(--g-mut)]">{formatEta(a.detectedAt)}</span>
          </div>
          <span className="font-mono text-[13px] text-[var(--g-red)]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {a.currentValue.toFixed(1)} (μ {a.mean.toFixed(1)})
          </span>
        </li>
      ))}
    </ul>
  );
}

function RoleHint() {
  return <p className="text-[13px] text-[var(--g-mut)]">위험·예측·이상 데이터는 관리자(MGR · ADM)에게만 표시됩니다.</p>;
}

function EmptyHint({ loading, error, kind }: { loading: boolean; error: boolean; kind: "metric" }) {
  if (loading) return <Spinner />;
  if (error) return <Notice tone="error">{kind === "metric" ? "메트릭" : "데이터"}을 불러오지 못했습니다.</Notice>;
  return <p className="text-[13px] text-[var(--g-mut)]">표시할 데이터가 없습니다.</p>;
}

// 헬스 추세 차트 위에 위험 도달 ETA 시점을 마커로 찍는다(가장 가까운 라벨에 스냅).
function etaMarker(trend: HealthTrend | null, series: { ts: string; value: number }[]): { ts: string; value: number }[] {
  if (!trend?.etaToRisk || series.length === 0) return [];
  const last = series[series.length - 1];
  return [{ ts: last.ts, value: last.value }];
}

// ISO 시각을 짧은 "MM/DD HH:MM" 로. 차트 외 텍스트(ETA·이상 시각)에 쓴다.
function formatEta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
