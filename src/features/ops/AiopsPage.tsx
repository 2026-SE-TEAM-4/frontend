import { useEffect, useMemo, useState } from "react";

import {
  CorrelationTimeline,
  KpiTile,
  MetricTimeSeries,
  Panel,
  StatusChip,
} from "@/components/viz";
import type { MetricPoint, StatusTone } from "@/components/viz";
import { Notice } from "@/components/ui/Notice";
import { RefreshBar } from "@/components/ui/RefreshBar";
import { Spinner } from "@/components/ui/Spinner";
import { useApi } from "@/hooks/useApi";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";

import { RootCauseCard } from "./aiopsRootCauseCard";
import type {
  Anomaly,
  IncidentDetailResp,
  IncidentListResp,
  IncidentSummaryResp,
  IncidentSummaryRow,
  MetricKind,
  MetricSeriesResp,
  Severity,
} from "./aiopsTypes";

const LIST_REFRESH_MS = 3_000;
const METRIC_THRESHOLD = 80;

const SEV_TONE: Record<Severity, StatusTone> = {
  CRITICAL: "crit",
  WARNING: "warn",
  INFO: "info",
};

const SEV_LABEL: Record<Severity, string> = {
  CRITICAL: "위험",
  WARNING: "주의",
  INFO: "정보",
};

const SEV_COLOR: Record<Severity, string> = {
  CRITICAL: "var(--g-red)",
  WARNING: "var(--g-yel)",
  INFO: "var(--g-blu)",
};

// 이상탐지 메트릭은 6h 시계열에서 다른 키로 들어오므로 매핑한다.
const METRIC_FIELD: Record<MetricKind, "cpu" | "mem" | "gpu" | "net"> = {
  CPU: "cpu",
  MEM: "mem",
  GPU: "gpu",
  NET: "net",
};

function severityOf(row: IncidentSummaryRow): Severity {
  return (row.severity as Severity) in SEV_TONE ? (row.severity as Severity) : "INFO";
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 인시던트 창(시작~마지막 이상) 안에서 각 이상의 시간 위치를 0~100%로 변환한다.
function buildTimeline(incident: IncidentSummaryRow, anomalies: Anomaly[]) {
  const times = [
    new Date(incident.startedAt).getTime(),
    ...anomalies.map((a) => new Date(a.detectedAt).getTime()),
  ];
  const min = Math.min(...times);
  const max = Math.max(...times);
  const span = max - min || 1;

  const ticks = anomalies.map((a) => {
    const sev = severityOf(incident);
    const tone: StatusTone = sev === "CRITICAL" ? "crit" : sev === "WARNING" ? "warn" : "info";
    return { posPct: ((new Date(a.detectedAt).getTime() - min) / span) * 100, tone };
  });

  const groups =
    anomalies.length > 0
      ? [
          {
            leftPct: Math.min(...ticks.map((t) => t.posPct)),
            rightPct: Math.max(...ticks.map((t) => t.posPct)),
            label: `이상 ${anomalies.length}건 묶음`,
          },
        ]
      : [];

  return { ticks, groups };
}

// 이상이 가장 많이 잡힌 (서버, 메트릭) 조합을 대표로 고른다.
function pickPrimary(anomalies: Anomaly[]): { serverId: number; metric: MetricKind } | null {
  if (anomalies.length === 0) return null;
  const counts = new Map<string, number>();
  for (const a of anomalies) {
    const key = `${a.serverId}|${a.metric}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  let bestKey = "";
  let bestCount = -1;
  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestKey = key;
      bestCount = count;
    }
  }
  const [serverId, metric] = bestKey.split("|");
  return { serverId: Number(serverId), metric: metric as MetricKind };
}

function HeroStrip({ list }: { list: IncidentListResp }) {
  const open = list.incidents.filter((i) => i.status === "OPEN");
  const crit = open.filter((i) => severityOf(i) === "CRITICAL").length;
  const warn = open.filter((i) => severityOf(i) === "WARNING").length;

  // 노이즈 감소율로 "이상 N건 → 인시던트 M건" 식을 복원해 보여준다.
  const grouped = open.length;
  const rate = list.noiseReductionRate;
  const rawAnomalies = rate < 1 && grouped > 0 ? Math.round(grouped / (1 - rate)) : grouped;

  // 위험 서버: 열린 인시던트가 가리키는 고유 서버 수.
  const riskServers = new Set<number>();
  for (const i of open) for (const s of i.serverIds) riskServers.add(s);

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiTile
        label="노이즈 감소 (중복 알림 줄이기)"
        value={`${Math.round(rate * 100)}`}
        unit="%"
        delta={`이상 ${rawAnomalies}건 → 인시던트 ${grouped}건`}
        deltaTone="down"
      />
      <KpiTile
        label="열린 인시던트 (진행 중 장애)"
        value={open.length}
        delta={`위험 ${crit} · 주의 ${warn}`}
        deltaTone={crit > 0 ? "up" : "neutral"}
      />
      <KpiTile
        label="감지 기준"
        value="평소값 기준"
        delta="최근 7일 평균에서 크게 벗어나면 이상으로 감지"
        deltaTone="neutral"
      />
      <KpiTile
        label="위험 서버"
        value={riskServers.size}
        delta="진행 중 장애가 가리키는 서버"
        deltaTone={riskServers.size > 0 ? "up" : "neutral"}
      />
    </div>
  );
}

function IncidentRow({
  row,
  selected,
  onSelect,
}: {
  row: IncidentSummaryRow;
  selected: boolean;
  onSelect: () => void;
}) {
  const sev = severityOf(row);
  const resolved = row.status === "RESOLVED";
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="flex w-full items-stretch gap-3 rounded-md border px-3 py-2.5 text-left"
      style={{
        borderColor: selected ? "var(--g-acc)" : "var(--g-bd)",
        background: selected ? "var(--g-accbg)" : "var(--g-pan)",
      }}
    >
      <span className="w-[3px] shrink-0 rounded-full" style={{ background: SEV_COLOR[sev] }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[14px] font-bold text-[var(--g-tx)]">INC-{row.id}</span>
          <StatusChip
            tone={resolved ? "ok" : SEV_TONE[sev]}
            label={resolved ? "해결됨" : SEV_LABEL[sev]}
          />
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-[var(--g-mut)]">
          <span className="font-mono tnum">서버 {row.serverIds.join(", ") || "—"}</span>
          <span className="font-mono tnum">이상 {row.anomalyCount}건</span>
          <span className="font-mono tnum">{fmtTime(row.startedAt)}</span>
        </div>
      </div>
    </button>
  );
}

function IncidentList({
  list,
  selectedId,
  onSelect,
}: {
  list: IncidentListResp;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <Panel title="인시던트 (장애 묶음)" sub={`${list.incidents.length}건 · 3초마다 갱신`}>
      {list.incidents.length === 0 ? (
        <p className="py-6 text-center text-[14px] text-[var(--g-mut)]">인시던트가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.incidents.map((row) => (
            <IncidentRow
              key={row.id}
              row={row}
              selected={row.id === selectedId}
              onSelect={() => onSelect(row.id)}
            />
          ))}
        </div>
      )}
    </Panel>
  );
}

function DetailHeader({ incident }: { incident: IncidentSummaryRow }) {
  const sev = severityOf(incident);
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="font-mono text-[20px] font-bold text-[var(--g-tx)]">INC-{incident.id}</span>
      <StatusChip
        tone={incident.status === "RESOLVED" ? "ok" : SEV_TONE[sev]}
        label={incident.status === "RESOLVED" ? "해결됨" : SEV_LABEL[sev]}
      />
      <span className="font-mono text-[13px] text-[var(--g-mut)] tnum">
        영향 서버 {incident.serverIds.join(", ") || "—"}
      </span>
    </div>
  );
}

// 선택된 인시던트의 대표 서버 메트릭 시계열 + 이상 마커.
function PrimaryMetricChart({
  primary,
  anomalies,
}: {
  primary: { serverId: number; metric: MetricKind };
  anomalies: Anomaly[];
}) {
  const { data, loading, error } = useApi<MetricSeriesResp>(
    `/servers/${primary.serverId}/metrics?window=6h`,
  );

  const field = METRIC_FIELD[primary.metric];

  const series: MetricPoint[] = useMemo(() => {
    if (!data) return [];
    return data.points.flatMap((p) => {
      const raw = p[field];
      if (raw === null || raw === undefined) return [];
      return [{ ts: fmtTime(p.ts), value: raw }];
    });
  }, [data, field]);

  const anomalyPoints = useMemo(
    () =>
      anomalies
        .filter((a) => a.serverId === primary.serverId && a.metric === primary.metric)
        .map((a) => ({ ts: fmtTime(a.detectedAt), value: a.currentValue })),
    [anomalies, primary],
  );

  return (
    <Panel
      title="대표 사용량 추세 (메트릭)"
      sub={`서버 ${primary.serverId} · ${primary.metric} · 최근 6시간`}
    >
      {loading && <Spinner />}
      {error && <Notice tone="error">메트릭을 불러오지 못했습니다. {error.message}</Notice>}
      {!loading && !error && series.length === 0 && (
        <p className="py-6 text-center text-[14px] text-[var(--g-mut)]">표시할 메트릭이 없습니다.</p>
      )}
      {!loading && !error && series.length > 0 && (
        <MetricTimeSeries
          data={series}
          threshold={METRIC_THRESHOLD}
          anomalies={anomalyPoints}
          height={240}
        />
      )}
    </Panel>
  );
}

function IncidentDetail({ incidentId }: { incidentId: number }) {
  const detail = useApi<IncidentDetailResp>(`/ops/incidents/${incidentId}`);
  const summary = useApi<IncidentSummaryResp>(`/ops/incidents/${incidentId}/summary`);

  if (detail.loading) return <Spinner />;
  if (detail.error)
    return <Notice tone="error">인시던트 상세를 불러오지 못했습니다. {detail.error.message}</Notice>;
  if (!detail.data) return null;

  const { incident, anomalies } = detail.data;
  const { ticks, groups } = buildTimeline(incident, anomalies);
  const primary = pickPrimary(anomalies);

  return (
    <div className="flex flex-col gap-4">
      <Panel
        title="상관 타임라인 (관련 이상 묶음)"
        sub={`서로 관련 있는 이상 ${anomalies.length}건을 한 인시던트로 묶었습니다`}
      >
        <DetailHeader incident={incident} />
        {anomalies.length > 0 ? (
          <CorrelationTimeline ticks={ticks} groups={groups} />
        ) : (
          <p className="py-4 text-center text-[14px] text-[var(--g-mut)]">묶인 이상이 없습니다.</p>
        )}
      </Panel>

      {primary && <PrimaryMetricChart primary={primary} anomalies={anomalies} />}

      <RootCauseCard
        summary={(summary.data as IncidentSummaryResp | null) ?? null}
        loading={summary.loading}
        error={summary.error}
      />
    </div>
  );
}

export function AiopsPage() {
  const { data, loading, error, lastUpdatedAt, refetch } = useApi<IncidentListResp>("/ops/incidents", LIST_REFRESH_MS);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 기본 선택: 첫 OPEN 인시던트(없으면 첫 항목). 사용자가 고른 뒤에는 유지한다.
  useEffect(() => {
    if (!data || selectedId !== null) return;
    const firstOpen = data.incidents.find((i) => i.status === "OPEN");
    const fallback = data.incidents[0];
    const next = firstOpen ?? fallback;
    if (next) setSelectedId(next.id);
  }, [data, selectedId]);

  return (
    <div>
      <TraceBar
        screen="AIOps 모니터링 (A3)"
        api="GET /ops/incidents · /incidents/{id} · /incidents/{id}/summary · /servers/{id}/metrics"
        feature="F27·F28·F31~F34"
        uc="UC18 · UC24 · UC22 · UC25"
        entity="Incident · AnomalyRecord · Forecast"
      />
      <PageHead
        title="AIOps 모니터링 (자동 장애 감지)"
        desc="평소와 다르게 튄 값(이상)을 자동으로 찾아, 서로 관련 있는 것끼리 묶은 장애 묶음(인시던트)입니다. 인시던트를 고르면 묶은 근거와 AI가 추정한 근본 원인(진짜 원인)을 볼 수 있습니다."
        actions={<RefreshBar lastUpdatedAt={lastUpdatedAt} loading={loading} onRefresh={refetch} />}
      />

      {loading && !data && <Spinner />}
      {error && <Notice tone="error">인시던트를 불러오지 못했습니다. {error.message}</Notice>}

      {data && (
        <>
          <HeroStrip list={data} />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(320px,420px)_1fr]">
            <IncidentList list={data} selectedId={selectedId} onSelect={setSelectedId} />
            <div>
              {selectedId !== null ? (
                <IncidentDetail key={selectedId} incidentId={selectedId} />
              ) : (
                <Panel title="상세" sub="인시던트를 선택하세요">
                  <p className="py-8 text-center text-[14px] text-[var(--g-mut)]">
                    왼쪽에서 인시던트를 선택하면 상세 근거가 표시됩니다.
                  </p>
                </Panel>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
