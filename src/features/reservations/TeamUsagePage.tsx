import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { Table, Td, Th } from "@/components/ui/Table";
import { formatRange } from "@/lib/format";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { Reservation } from "@/types/api";

const STATUS_LABEL: Record<string, string> = {
  RESERVED: "예약됨",
  IN_USE: "사용 중",
  RETURNED: "반납됨",
  CANCELED: "취소됨",
  EXPIRED: "만료됨",
  RECLAIMED: "회수됨",
};

export function TeamUsagePage() {
  const { data, loading, error } = useApi<Reservation[]>("/reservations");
  const reservations = data ?? [];
  const active = reservations.filter((r) => r.status === "RESERVED" || r.status === "IN_USE").length;

  return (
    <div>
      <TraceBar screen="팀 사용 현황 (M3)" api="GET /reservations" feature="F03" uc="UC02 · UC10" entity="Reservation" />
      <PageHead title="팀 사용 현황" desc="팀 전체 예약 현황입니다. 유휴 점유(낭비)를 식별하세요." />

      {!loading && !error && (
        <div className="mb-4 inline-flex rounded-[10px] border border-[var(--bd)] bg-[var(--bg)] px-4 py-2.5">
          <span className="font-mono text-[20px] font-bold text-[var(--acc)]">{active}</span>
          <span className="ml-2 self-center text-[12px] text-[var(--mut)]">진행 중인 팀 예약</span>
        </div>
      )}

      {loading && <Spinner />}
      {error && <Notice tone="error">팀 예약을 불러오지 못했습니다. {error.message}</Notice>}

      {!loading && !error && (
        <Table
          head={
            <>
              <Th>예약자</Th>
              <Th>서버</Th>
              <Th>기간</Th>
              <Th>상태</Th>
            </>
          }
        >
          {reservations.length === 0 ? (
            <tr>
              <Td className="text-center text-[var(--mut)]">팀 예약이 없습니다.</Td>
            </tr>
          ) : (
            reservations.map((r) => (
              <tr key={r.id} className="hover:bg-[#fbfcfe]">
                <Td className="font-semibold">사용자 #{r.user_id}</Td>
                <Td>서버 #{r.server_id}</Td>
                <Td className="font-mono text-[11.5px] text-[var(--text2)]">{formatRange(r.start_time, r.end_time)}</Td>
                <Td className="text-[12px]">{STATUS_LABEL[r.status] ?? r.status}</Td>
              </tr>
            ))
          )}
        </Table>
      )}
    </div>
  );
}
