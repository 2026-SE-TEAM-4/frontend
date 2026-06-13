import { Notice } from "@/components/ui/Notice";
import { RefreshBar } from "@/components/ui/RefreshBar";
import { Spinner } from "@/components/ui/Spinner";
import { KpiTile, Panel, StatusChip, Tabs, UptimeRibbon } from "@/components/viz";
import type { StatusTone } from "@/components/viz";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { AvailabilityResponse, AvailabilityRow } from "@/types/api";

import { deriveRibbonFromUptime } from "./availabilityRibbon";

// SLA 목표선. 데모용 기준값으로, 시스템 가용성이 이 값을 넘는지 한눈에 보여준다.
const SLA_TARGET = 99.0;

function formatMinutes(value: number | null): string {
  if (value == null) return "—";
  return `${value.toLocaleString("ko-KR")}분`;
}

// 위험 뱃지(riskBadge)와 가동률로 상태 칩을 정한다. 색만이 아니라 라벨도 함께 전달한다.
function statusOf(row: AvailabilityRow): { tone: StatusTone; label: string } {
  if (row.riskBadge) return { tone: "crit", label: "위험" };
  if (row.uptime < SLA_TARGET) return { tone: "warn", label: "주의" };
  return { tone: "ok", label: "정상" };
}

// 시스템 전체 집계가 없는 항목(MTBF·MTTR)은 서버별 값의 평균으로 도출한다.
function average(values: (number | null)[]): number | null {
  const present = values.filter((v): v is number => v != null);
  if (present.length === 0) return null;
  return present.reduce((sum, v) => sum + v, 0) / present.length;
}

function HeroKpis({ data }: { data: AvailabilityResponse }) {
  const avgMtbf = average(data.servers.map((s) => s.mtbf));
  const avgMttr = average(data.servers.map((s) => s.mttr));
  // 총 다운타임은 엔드포인트가 직접 주지 않으므로, MTTR 합으로 누적 복구시간(근사)을 보여준다.
  const totalDowntime = data.servers.reduce((sum, s) => sum + (s.mttr ?? 0), 0);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiTile label="시스템 가용성" value={data.systemAvailability.toFixed(2)} unit="%" />
      <KpiTile label="누적 복구시간(MTTR 합)" value={totalDowntime.toLocaleString("ko-KR")} unit="분" />
      <KpiTile label="평균 MTBF" value={avgMtbf == null ? "—" : Math.round(avgMtbf).toLocaleString("ko-KR")} unit="분" />
      <KpiTile label="평균 MTTR" value={avgMttr == null ? "—" : Math.round(avgMttr).toLocaleString("ko-KR")} unit="분" />
    </div>
  );
}

function AvailabilitySummary({ data }: { data: AvailabilityResponse }) {
  const meetsSla = data.systemAvailability >= SLA_TARGET;
  return (
    <Panel title="시스템 가용성" sub="전체 서버 가동 시간 기준">
      <div className="flex items-baseline gap-2">
        <span
          className="tnum text-[44px] font-bold leading-none text-[var(--g-tx)]"
          style={{ fontFamily: "var(--mono)" }}
        >
          {data.systemAvailability.toFixed(2)}
        </span>
        <span className="text-[18px] text-[var(--g-mut)]">%</span>
      </div>
      <div className="mt-4">
        <StatusChip
          tone={meetsSla ? "ok" : "warn"}
          label={meetsSla ? `SLA 목표 ${SLA_TARGET}% 충족` : `SLA 목표 ${SLA_TARGET}% 미달`}
        />
      </div>
      <p className="mt-3 text-[12px] leading-relaxed text-[var(--g-mut)]">
        가용성은 서버별 가동 시간을 합산해 산출합니다. 이 엔드포인트는 일자별 시계열을 제공하지
        않으므로 추세 그래프 대신 현재 집계값을 표시합니다.
      </p>
    </Panel>
  );
}

function ReliabilityTable({ rows }: { rows: AvailabilityRow[] }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[13px] text-[var(--g-mut)]">데이터가 없습니다.</p>;
  }
  // 가용성 오름차순 정렬 — 가장 나쁜 서버가 위로.
  const sorted = [...rows].sort((a, b) => a.uptime - b.uptime);

  return (
    <table className="w-full border-collapse text-[13px]">
      <thead>
        <tr className="border-b border-[var(--g-bd)] text-left text-[12px] text-[var(--g-mut)]">
          <th className="py-2 pr-3 font-semibold">서버</th>
          <th className="py-2 pr-3 font-semibold">가용성</th>
          <th className="py-2 pr-3 font-semibold">MTBF</th>
          <th className="py-2 pr-3 font-semibold">MTTR</th>
          <th className="py-2 font-semibold">상태</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => {
          const status = statusOf(row);
          return (
            <tr key={row.id} className="border-b border-[var(--g-bd)] last:border-0">
              <td className="py-2.5 pr-3 font-semibold text-[var(--g-tx)]">서버 #{row.id}</td>
              <td className="tnum py-2.5 pr-3" style={{ fontFamily: "var(--mono)" }}>
                {row.uptime.toFixed(2)}%
              </td>
              <td className="tnum py-2.5 pr-3 text-[var(--g-mut)]" style={{ fontFamily: "var(--mono)" }}>
                {formatMinutes(row.mtbf)}
              </td>
              <td className="tnum py-2.5 pr-3 text-[var(--g-mut)]" style={{ fontFamily: "var(--mono)" }}>
                {formatMinutes(row.mttr)}
              </td>
              <td className="py-2.5">
                <StatusChip tone={status.tone} label={status.label} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function StatusRibbons({ rows }: { rows: AvailabilityRow[] }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-[13px] text-[var(--g-mut)]">데이터가 없습니다.</p>;
  }
  const sorted = [...rows].sort((a, b) => a.uptime - b.uptime);

  return (
    <div>
      <div className="space-y-4">
        {sorted.map((row) => (
          <div key={row.id}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-[13px] font-semibold text-[var(--g-tx)]">서버 #{row.id}</span>
              <span className="tnum text-[12px] text-[var(--g-mut)]" style={{ fontFamily: "var(--mono)" }}>
                {row.uptime.toFixed(2)}%
              </span>
            </div>
            <UptimeRibbon days={deriveRibbonFromUptime(row.uptime)} />
          </div>
        ))}
      </div>
      <p className="mt-4 text-[12px] leading-relaxed text-[var(--g-mut)]">
        이 리본은 일자별 장애 이벤트가 아니라 가동률을 비율로 환산한 근사 요약입니다. 빨강·노랑
        구간 비율이 비가동 비율(100% − 가용성)에 대응합니다.
      </p>
    </div>
  );
}

export function AvailabilityPage() {
  const { data, loading, error, lastUpdatedAt, refetch } = useApi<AvailabilityResponse>("/ops/availability", 3_000);

  return (
    <div>
      <TraceBar
        screen="가용성 현황"
        api="GET /ops/availability"
        feature="F22"
        uc="UC21"
        entity="Server · ServerMetric"
      />
      <PageHead
        title="가용성 현황"
        desc="서버별 업타임·MTBF·MTTR과 시스템 전체 가용성입니다."
        actions={<RefreshBar lastUpdatedAt={lastUpdatedAt} loading={loading} onRefresh={refetch} />}
      />

      {loading && !data && <Spinner />}
      {error && <Notice tone="error">가용성을 불러오지 못했습니다. {error.message}</Notice>}

      {data && (
        <div className="space-y-4">
          <HeroKpis data={data} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <AvailabilitySummary data={data} />

            <Panel title="서버 신뢰성">
              <Tabs
                tabs={[
                  { key: "table", label: "신뢰성 테이블" },
                  { key: "ribbon", label: "상태 리본" },
                ]}
                defaultValue="table"
              >
                {{
                  table: <ReliabilityTable rows={data.servers} />,
                  ribbon: <StatusRibbons rows={data.servers} />,
                }}
              </Tabs>
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
