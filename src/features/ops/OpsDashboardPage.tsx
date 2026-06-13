import { Notice } from "@/components/ui/Notice";
import { RefreshBar } from "@/components/ui/RefreshBar";
import { Spinner } from "@/components/ui/Spinner";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import {
  BulletBar,
  Heatmap,
  KpiTile,
  Panel,
  StatusChip,
  Tabs,
} from "@/components/viz";
import type { OpsDashboard, IncidentListResponse, ServerListResponse } from "@/types/api";
import {
  averageMetric,
  countAvailable,
  formatBucketHour,
  healthTone,
  normalizeCells,
  severityTone,
  sortWorstFirst,
  statusLabel,
  statusTone,
  UC_DESC,
  type OpsHeatmapResponse,
  type OpsServerItem,
} from "./opsOverviewData";

// 모든 패널이 30초 주기로 함께 갱신된다.
const REFRESH_MS = 3_000;

export function OpsDashboardPage() {
  const servers = useApi<ServerListResponse>("/servers", REFRESH_MS);
  const dashboard = useApi<OpsDashboard>("/ops/dashboard", REFRESH_MS);
  const incidents = useApi<IncidentListResponse>("/ops/incidents", REFRESH_MS);
  const heatmap = useApi<OpsHeatmapResponse>("/ops/metrics/heatmap?metric=GPU&window=12h", REFRESH_MS);

  const serverList: OpsServerItem[] = servers.data?.servers ?? [];
  const openIncidents = (incidents.data?.incidents ?? []).filter((i) => i.status !== "RESOLVED");

  const anyLoading = servers.loading || dashboard.loading || incidents.loading;
  const fatalError = servers.error ?? dashboard.error;

  function handleRefresh() {
    servers.refetch();
    dashboard.refetch();
    incidents.refetch();
    heatmap.refetch();
  }

  return (
    <div>
      <TraceBar
        screen="운영 개요 (A1)"
        api="GET /servers · /ops/dashboard · /ops/incidents · /ops/metrics/heatmap"
        feature="F21"
        uc="UC14~UC19 · UC21"
        entity="Server · ServerMetric · Incident · SchedulerLog"
      />
      <PageHead
        title="운영 개요"
        desc="플릿 사용률·건강·인시던트·스케줄러를 한 화면에서 본다."
        actions={
          <RefreshBar
            lastUpdatedAt={servers.lastUpdatedAt}
            loading={anyLoading}
            onRefresh={handleRefresh}
          />
        }
      />

      {anyLoading && !servers.data && <Spinner />}
      {fatalError && (
        <Notice tone="error">운영 데이터를 불러오지 못했습니다. {fatalError.message}</Notice>
      )}

      {servers.data && (
        <>
          <KpiStrip servers={serverList} dashboard={dashboard.data} openIncidentCount={openIncidents.length} />

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Panel title="플릿" sub="위험한 서버가 위로 정렬됩니다.">
              <Tabs
                tabs={[
                  { key: "table", label: "플릿 테이블" },
                  { key: "heat", label: "히트맵" },
                ]}
                defaultValue="table"
              >
                {{
                  table: <FleetTable servers={serverList} />,
                  heat: <HeatmapTab data={heatmap.data} loading={heatmap.loading} error={!!heatmap.error} />,
                }}
              </Tabs>
            </Panel>

            <div className="flex flex-col gap-4">
              <IncidentsPanel data={incidents.data} loading={incidents.loading} error={!!incidents.error} />
              <SchedulerPanel jobs={dashboard.data?.scheduler ?? []} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KpiStrip({
  servers,
  dashboard,
  openIncidentCount,
}: {
  servers: OpsServerItem[];
  dashboard: OpsDashboard | null;
  openIncidentCount: number;
}) {
  const total = servers.length;
  const available = countAvailable(servers);
  const avgCpu = averageMetric(servers, (m) => m.cpuUsage);
  const avgGpu = averageMetric(servers, (m) => m.gpuUsage);
  const successRate = dashboard ? Math.round(dashboard.metrics.successRate * 100) : null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <KpiTile label="가용 서버" value={total ? `${available}/${total}` : "—"} />
      <KpiTile label="평균 CPU" value={fmtPct(avgCpu)} unit={avgCpu === null ? undefined : "%"} />
      <KpiTile label="평균 GPU" value={fmtPct(avgGpu)} unit={avgGpu === null ? undefined : "%"} />
      <KpiTile
        label="열린 인시던트"
        value={openIncidentCount}
        deltaTone={openIncidentCount > 0 ? "down" : "neutral"}
        delta={openIncidentCount > 0 ? "조치 필요" : "안정"}
      />
      <KpiTile
        label="수집 성공률"
        value={successRate === null ? "—" : successRate}
        unit={successRate === null ? undefined : "%"}
      />
    </div>
  );
}

function FleetTable({ servers }: { servers: OpsServerItem[] }) {
  if (servers.length === 0) {
    return <p className="py-6 text-center text-[13px] text-[var(--g-mut)]">표시할 서버가 없습니다.</p>;
  }

  const sorted = sortWorstFirst(servers);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--g-bd)] text-left text-[11px] uppercase tracking-wide text-[var(--g-mut)]">
            <th className="py-2 pr-3 font-semibold whitespace-nowrap">서버</th>
            <th className="py-2 pr-3 font-semibold whitespace-nowrap">상태</th>
            <th className="w-[160px] py-2 pr-3 font-semibold whitespace-nowrap">CPU</th>
            <th className="w-[160px] py-2 pr-3 font-semibold whitespace-nowrap">GPU</th>
            <th className="w-[160px] py-2 pr-3 font-semibold whitespace-nowrap">MEM</th>
            <th className="py-2 pr-3 font-semibold whitespace-nowrap">HEALTH</th>
            <th className="py-2 pr-3 font-semibold whitespace-nowrap">RISK</th>
            <th className="py-2 font-semibold whitespace-nowrap">점유자</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <FleetRow key={s.id} server={s} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FleetRow({ server }: { server: OpsServerItem }) {
  const m = server.latestMetric;
  const live = m && m.status === "OK";

  return (
    <tr className="border-b border-[var(--g-bd)] last:border-0">
      <td className="py-2.5 pr-3 font-semibold text-[var(--g-tx)] whitespace-nowrap">{server.name}</td>
      <td className="py-2.5 pr-3 whitespace-nowrap">
        <StatusChip tone={statusTone(server.status)} label={statusLabel(server.status)} />
      </td>
      <td className="py-2.5 pr-3">{live ? <BulletBar value={m.cpuUsage} /> : <Dash />}</td>
      <td className="py-2.5 pr-3">
        {live && m.gpuUsage !== null ? <BulletBar value={m.gpuUsage} /> : <Dash />}
      </td>
      <td className="py-2.5 pr-3">{live ? <BulletBar value={m.memUsage} /> : <Dash />}</td>
      <td className="py-2.5 pr-3">
        <HealthBadge score={server.healthScore} />
      </td>
      <td className="py-2.5 pr-3 font-mono tnum">
        <RiskCell score={server.riskScore} />
      </td>
      <td className="py-2.5 text-[var(--g-mut)]">{server.occupant ?? "—"}</td>
    </tr>
  );
}

const HEALTH_STYLE: Record<"ok" | "warn" | "crit", { bg: string; bd: string; tx: string }> = {
  ok: { bg: "var(--g-pan2)", bd: "var(--g-grnbd)", tx: "var(--g-grn)" },
  warn: { bg: "var(--g-pan2)", bd: "var(--g-yelbd)", tx: "var(--g-yel)" },
  crit: { bg: "var(--g-pan2)", bd: "var(--g-redbd)", tx: "var(--g-red)" },
};

function HealthBadge({ score }: { score: number | null }) {
  const tone = healthTone(score);
  if (tone === "none" || score === null) return <Dash />;
  const c = HEALTH_STYLE[tone];
  return (
    <span
      className="inline-flex min-w-[34px] justify-center rounded-[5px] border px-1.5 py-0.5 font-mono text-[13px] font-bold tnum"
      style={{ background: c.bg, borderColor: c.bd, color: c.tx }}
    >
      {score}
    </span>
  );
}

// 위험 점수 색 구간: >=50 빨강, >=25 노랑, 그 외 muted. null/undefined 면 "—".
function RiskCell({ score }: { score: number | null | undefined }) {
  if (score === null || score === undefined) return <Dash />;
  const rounded = Math.round(score);
  const color = rounded >= 50 ? "var(--g-red)" : rounded >= 25 ? "var(--g-yel)" : "var(--g-mut)";
  return <span style={{ color }}>{rounded}</span>;
}

function HeatmapTab({
  data,
  loading,
  error,
}: {
  data: OpsHeatmapResponse | null;
  loading: boolean;
  error: boolean;
}) {
  if (loading && !data) return <Spinner />;
  if (error) return <Notice tone="error">히트맵 데이터를 불러오지 못했습니다.</Notice>;
  if (!data || data.serverNames.length === 0 || data.buckets.length === 0) {
    return <p className="py-6 text-center text-[13px] text-[var(--g-mut)]">히트맵 데이터가 없습니다.</p>;
  }

  return (
    <Heatmap
      rows={data.serverNames}
      cols={data.buckets.map(formatBucketHour)}
      cells={normalizeCells(data.cells)}
      unit="%"
    />
  );
}

function IncidentsPanel({
  data,
  loading,
  error,
}: {
  data: IncidentListResponse | null;
  loading: boolean;
  error: boolean;
}) {
  const open = (data?.incidents ?? []).filter((i) => i.status !== "RESOLVED");
  const noisePct = data ? Math.round(data.noiseReductionRate * 100) : null;

  return (
    <Panel
      title="활성 인시던트"
      right={
        noisePct === null ? undefined : (
          <span className="rounded-full border border-[var(--g-bd)] bg-[var(--g-pan2)] px-2 py-0.5 font-mono text-[11px] tnum text-[var(--g-mut)]">
            노이즈 -{noisePct}%
          </span>
        )
      }
    >
      {loading && !data && <Spinner />}
      {error && <Notice tone="error">인시던트를 불러오지 못했습니다.</Notice>}
      {data && open.length === 0 && (
        <p className="py-4 text-center text-[13px] text-[var(--g-mut)]">활성 인시던트가 없습니다.</p>
      )}
      {open.length > 0 && (
        <ul className="flex flex-col gap-2">
          {open.map((inc) => (
            <li
              key={inc.id}
              className="flex items-center gap-3 rounded-[7px] border border-[var(--g-bd)] bg-[var(--g-pan2)] px-3 py-2"
            >
              <span
                className="h-9 w-[3px] shrink-0 rounded-full"
                style={{ background: severityBarColor(inc.severity) }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusChip tone={severityTone(inc.severity)} label={inc.severity} />
                  <span className="font-mono text-[12px] tnum text-[var(--g-mut)]">#{inc.id}</span>
                </div>
                <div className="mt-1 text-[12px] text-[var(--g-mut)]">
                  이상 {inc.anomalyCount}건 · 서버 {inc.serverIds.length}대 ·{" "}
                  {new Date(inc.startedAt).toLocaleString("ko-KR")}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function SchedulerPanel({ jobs }: { jobs: OpsDashboard["scheduler"] }) {
  return (
    <Panel title="스케줄러 최근 잡">
      {jobs.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-[var(--g-mut)]">실행 기록이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {jobs.map((j) => (
            <li key={j.ucId} className="flex items-center gap-2 text-[12px]">
              <StatusChip tone={j.success ? "ok" : "crit"} label={j.success ? "성공" : "실패"} />
              <span className="font-mono text-[12px] text-[var(--g-tx)]">{j.ucId}</span>
              {UC_DESC[j.ucId] && (
                <span className="text-[11px] text-[var(--g-mut)]">{UC_DESC[j.ucId]}</span>
              )}
              <span className="ml-auto font-mono text-[11px] tnum text-[var(--g-mut)] whitespace-nowrap">
                {j.lastRun ? new Date(j.lastRun).toLocaleTimeString("ko-KR") : "—"} · {j.processed}건
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function Dash() {
  return <span className="text-[var(--g-mut)]">—</span>;
}

function fmtPct(v: number | null): string {
  return v === null ? "—" : v.toFixed(0);
}

function severityBarColor(severity: string): string {
  const tone = severityTone(severity);
  if (tone === "crit") return "var(--g-red)";
  if (tone === "warn") return "var(--g-yel)";
  return "var(--g-blu)";
}
