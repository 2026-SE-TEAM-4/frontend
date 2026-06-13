import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { Table, Td, Th } from "@/components/ui/Table";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { IncidentListResponse } from "@/types/api";

const SEV_CLASS: Record<string, string> = {
  CRITICAL: "bg-[var(--dngs)] text-[#842029]",
  WARNING: "bg-[var(--rsvs)] text-[#664d03]",
  INFO: "bg-[var(--accs)] text-[var(--acct)]",
};

export function AiopsPage() {
  const { data, loading, error } = useApi<IncidentListResponse>("/ops/incidents", 30_000);

  return (
    <div>
      <TraceBar
        screen="AIOps 모니터링 (A3)"
        api="GET /ops/incidents · /forecast · /incidents/{id}/summary"
        feature="F27·F28·F31~F34"
        uc="UC18 · UC24 · UC22 · UC25"
        entity="Incident · AnomalyRecord · Forecast"
      />
      <PageHead title="AIOps 모니터링" desc="이상탐지를 상관 분석한 인시던트입니다. 노이즈 감소율은 개별 이상 대비 묶음 비율입니다." />

      {!loading && !error && data && (
        <div className="mb-4 inline-flex rounded-[10px] border border-[var(--bd)] bg-[var(--bg)] px-4 py-2.5">
          <span className="font-mono text-[20px] font-bold text-[var(--acc)]">
            {Math.round(data.noiseReductionRate * 100)}%
          </span>
          <span className="ml-2 self-center text-[12px] text-[var(--mut)]">노이즈 감소율</span>
        </div>
      )}

      {loading && <Spinner />}
      {error && <Notice tone="error">인시던트를 불러오지 못했습니다. {error.message}</Notice>}

      {data && (
        <Table
          head={
            <>
              <Th>심각도</Th>
              <Th>상태</Th>
              <Th>이상 수</Th>
              <Th>대상 서버</Th>
              <Th>시작</Th>
            </>
          }
        >
          {data.incidents.length === 0 ? (
            <tr>
              <Td className="text-center text-[var(--mut)]">인시던트가 없습니다.</Td>
            </tr>
          ) : (
            data.incidents.map((inc) => (
              <tr key={inc.id} className="hover:bg-[#fbfcfe]">
                <Td>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${SEV_CLASS[inc.severity] ?? ""}`}>
                    {inc.severity}
                  </span>
                </Td>
                <Td className="text-[12px]">{inc.status}</Td>
                <Td className="font-mono text-[12px]">{inc.anomalyCount}</Td>
                <Td className="font-mono text-[11.5px] text-[var(--text2)]">{inc.serverIds.join(", ") || "—"}</Td>
                <Td className="font-mono text-[11px] text-[var(--mut)]">{new Date(inc.startedAt).toLocaleString("ko-KR")}</Td>
              </tr>
            ))
          )}
        </Table>
      )}
    </div>
  );
}
