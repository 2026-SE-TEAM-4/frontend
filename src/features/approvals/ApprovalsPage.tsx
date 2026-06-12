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
import type { ApprovalRequest } from "@/types/api";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "대기",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
  AUTO_REJECTED: "자동 거절(72h)",
};

export function ApprovalsPage() {
  const { data, loading, error, refetch } = useApi<ApprovalRequest[]>("/approval-requests");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function decide(id: number, action: "APPROVED" | "REJECTED") {
    setBusyId(id);
    setActionError(null);
    try {
      await apiFetch(`/approval-requests/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ action }),
      });
      refetch();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "처리에 실패했습니다.");
    } finally {
      setBusyId(null);
    }
  }

  const requests = data ?? [];

  return (
    <div>
      <TraceBar
        screen="승인 요청함 (M1)"
        api="GET /approval-requests · POST .../decision"
        feature="F10 · F11"
        uc="UC09 · UC17"
        entity="ApprovalRequest"
      />
      <PageHead
        title="승인 요청함"
        desc="Quota 초과 예약 요청을 승인·거절합니다. 72시간이 지나면 자동 거절됩니다."
        actions={<Button onClick={refetch}>↻ 새로고침</Button>}
      />

      {actionError && (
        <div className="mb-3">
          <Notice tone="error">{actionError}</Notice>
        </div>
      )}
      {loading && <Spinner />}
      {error && <Notice tone="error">요청을 불러오지 못했습니다. {error.message}</Notice>}

      {!loading && !error && (
        <Table
          head={
            <>
              <Th>요청자</Th>
              <Th>서버</Th>
              <Th>기간</Th>
              <Th>사유</Th>
              <Th>상태</Th>
              <Th />
            </>
          }
        >
          {requests.length === 0 ? (
            <tr>
              <Td className="text-center text-[var(--mut)]">대기 중인 요청이 없습니다.</Td>
            </tr>
          ) : (
            requests.map((r) => (
              <tr key={r.id} className="hover:bg-[#fbfcfe]">
                <Td className="font-semibold">사용자 #{r.requester_id}</Td>
                <Td>서버 #{r.server_id}</Td>
                <Td className="font-mono text-[11.5px] text-[var(--text2)]">
                  {formatRange(r.requested_start, r.requested_end)}
                </Td>
                <Td className="text-[12px] text-[var(--text2)]">{r.reason ?? "—"}</Td>
                <Td className="text-[12px]">{STATUS_LABEL[r.status] ?? r.status}</Td>
                <Td>
                  {r.status === "PENDING" && (
                    <div className="flex gap-1.5">
                      <Button variant="pri" disabled={busyId === r.id} onClick={() => decide(r.id, "APPROVED")}>
                        승인
                      </Button>
                      <Button variant="danger" disabled={busyId === r.id} onClick={() => decide(r.id, "REJECTED")}>
                        거절
                      </Button>
                    </div>
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
