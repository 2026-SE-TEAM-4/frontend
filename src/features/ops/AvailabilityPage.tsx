import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { Table, Td, Th } from "@/components/ui/Table";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { AvailabilityResponse } from "@/types/api";

export function AvailabilityPage() {
  const { data, loading, error } = useApi<AvailabilityResponse>("/ops/availability");

  return (
    <div>
      <TraceBar screen="가용성 현황" api="GET /ops/availability" feature="F22" uc="UC21" entity="Server · ServerMetric" />
      <PageHead title="가용성 현황" desc="서버별 업타임·MTBF·MTTR과 시스템 전체 가용성입니다." />

      {!loading && !error && data && (
        <div className="mb-4 inline-flex rounded-[10px] border border-[var(--bd)] bg-[var(--bg)] px-4 py-2.5">
          <span className="font-mono text-[20px] font-bold text-[var(--ok)]">{data.systemAvailability}%</span>
          <span className="ml-2 self-center text-[12px] text-[var(--mut)]">시스템 가용성</span>
        </div>
      )}

      {loading && <Spinner />}
      {error && <Notice tone="error">가용성을 불러오지 못했습니다. {error.message}</Notice>}

      {data && (
        <Table
          head={
            <>
              <Th>서버</Th>
              <Th>업타임</Th>
              <Th>MTBF</Th>
              <Th>MTTR</Th>
              <Th>위험</Th>
            </>
          }
        >
          {data.servers.length === 0 ? (
            <tr>
              <Td className="text-center text-[var(--mut)]">데이터가 없습니다.</Td>
            </tr>
          ) : (
            data.servers.map((s) => (
              <tr key={s.id} className="hover:bg-[#fbfcfe]">
                <Td className="font-semibold">서버 #{s.id}</Td>
                <Td className="font-mono text-[12px]">{s.uptime}%</Td>
                <Td className="font-mono text-[12px]">{s.mtbf ?? "—"}</Td>
                <Td className="font-mono text-[12px]">{s.mttr ?? "—"}</Td>
                <Td>
                  {s.riskBadge ? (
                    <span className="rounded-full bg-[var(--dngs)] px-2 py-0.5 text-[11px] font-bold text-[#842029]">위험</span>
                  ) : (
                    <span className="text-[12px] text-[var(--mut)]">정상</span>
                  )}
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}
    </div>
  );
}
