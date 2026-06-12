import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { Table, Td, Th } from "@/components/ui/Table";
import { apiFetch, ApiError } from "@/lib/api";
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

export function MyReservationsPage() {
  const { data, loading, error, refetch } = useApi<Reservation[]>("/reservations");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function act(id: number, kind: "cancel" | "return") {
    setBusyId(id);
    setActionError(null);
    try {
      await apiFetch(`/reservations/${id}/${kind}`, { method: "POST" });
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "처리에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  const reservations = data ?? [];

  return (
    <div>
      <TraceBar
        screen="내 예약 (S5)"
        api="GET /reservations · POST .../cancel · .../return"
        feature="F03 · F06 · F07"
        uc="UC02 · UC06 · UC07"
        entity="Reservation"
      />
      <PageHead
        title="내 예약"
        desc="예약 상태별 목록입니다. 예약됨은 취소, 사용 중은 반납할 수 있습니다."
        actions={<Button onClick={refetch}>↻ 새로고침</Button>}
      />

      {actionError && (
        <div className="mb-3">
          <Notice tone="error">{actionError}</Notice>
        </div>
      )}

      {loading && <Spinner />}
      {error && <Notice tone="error">예약을 불러오지 못했습니다. {error.message}</Notice>}

      {!loading && !error && (
        <Table
          head={
            <>
              <Th>서버</Th>
              <Th>기간</Th>
              <Th>상태</Th>
              <Th />
            </>
          }
        >
          {reservations.length === 0 ? (
            <tr>
              <Td className="text-center text-[var(--mut)]">예약이 없습니다.</Td>
            </tr>
          ) : (
            reservations.map((r) => (
              <tr key={r.id} className="hover:bg-[#fbfcfe]">
                <Td className="font-semibold">서버 #{r.server_id}</Td>
                <Td className="font-mono text-[11.5px] text-[var(--text2)]">
                  {formatRange(r.start_time, r.end_time)}
                </Td>
                <Td className="text-[12px]">{STATUS_LABEL[r.status] ?? r.status}</Td>
                <Td>
                  {r.status === "RESERVED" && (
                    <Button variant="danger" disabled={busyId === r.id} onClick={() => act(r.id, "cancel")}>
                      취소
                    </Button>
                  )}
                  {r.status === "IN_USE" && (
                    <Button variant="outline" disabled={busyId === r.id} onClick={() => act(r.id, "return")}>
                      반납
                    </Button>
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
