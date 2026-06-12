import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { Table, Td, Th } from "@/components/ui/Table";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { OpsDashboard } from "@/types/api";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[10px] border border-[var(--bd)] bg-[var(--bg)] p-4">
      <h2 className="mb-3 text-[13px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Metric({ value, label, color }: { value: number | string; label: string; color?: string }) {
  return (
    <div>
      <div className="font-mono text-[22px] font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-0.5 text-[11.5px] text-[var(--mut)]">{label}</div>
    </div>
  );
}

export function OpsDashboardPage() {
  const { data, loading, error } = useApi<OpsDashboard>("/ops/dashboard");

  return (
    <div>
      <TraceBar screen="운영 대시보드 (A1)" api="GET /ops/dashboard" feature="F21" uc="UC14~UC19 · UC21" entity="SchedulerLog · ServerMetric · Server" />
      <PageHead title="운영 대시보드" desc="스케줄러 동작·메트릭 수집·자동 조치·서버 건강을 한눈에." />

      {loading && <Spinner />}
      {error && <Notice tone="error">대시보드를 불러오지 못했습니다. {error.message}</Notice>}

      {data && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="건강 분포">
            <div className="flex gap-6">
              <Metric value={data.health.정상} label="정상" color="var(--ok)" />
              <Metric value={data.health.주의} label="주의" color="var(--rsv)" />
              <Metric value={data.health.위험} label="위험" color="var(--dng)" />
            </div>
          </Card>
          <Card title="메트릭 수집 (24h)">
            <div className="flex items-baseline gap-6">
              <Metric value={`${Math.round(data.metrics.successRate * 100)}%`} label="수집 성공률" color="var(--acc)" />
              <div className="text-[12px] text-[var(--mut)]">
                무응답: {data.metrics.missing.length ? data.metrics.missing.join(", ") : "없음"}
              </div>
            </div>
          </Card>
          <Card title="자동 조치 (24h)">
            <div className="flex gap-6">
              <Metric value={data.autoActions.reclaimed} label="유휴 회수" />
              <Metric value={data.autoActions.expired} label="만료 반납" />
              <Metric value={data.autoActions.autoRejected} label="자동 거절" />
            </div>
          </Card>
          <Card title="스케줄러 최근 실행">
            <Table
              head={
                <>
                  <Th>UC</Th>
                  <Th>최근 실행</Th>
                  <Th>결과</Th>
                  <Th>처리</Th>
                </>
              }
            >
              {data.scheduler.length === 0 ? (
                <tr>
                  <Td className="text-center text-[var(--mut)]">기록 없음</Td>
                </tr>
              ) : (
                data.scheduler.map((s, i) => (
                  <tr key={i}>
                    <Td className="font-mono text-[12px]">{s.ucId}</Td>
                    <Td className="font-mono text-[11px] text-[var(--mut)]">
                      {s.lastRun ? new Date(s.lastRun).toLocaleString("ko-KR") : "—"}
                    </Td>
                    <Td className={`text-[12px] font-semibold ${s.success ? "text-[var(--ok)]" : "text-[var(--dng)]"}`}>
                      {s.success ? "성공" : "실패"}
                    </Td>
                    <Td className="font-mono text-[12px]">{s.processed}</Td>
                  </tr>
                ))
              )}
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
