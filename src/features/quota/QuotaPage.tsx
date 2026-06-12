import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { Table, Td, Th } from "@/components/ui/Table";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { Quota } from "@/types/api";

export function QuotaPage() {
  const { user } = useAuth();
  const teamId = user?.teamId ?? null;
  const { data, loading, error, refetch } = useApi<Quota[]>(teamId ? `/teams/${teamId}/quotas` : null);
  const [edits, setEdits] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  async function save(q: Quota) {
    const raw = edits[q.id];
    const limit = Number(raw);
    if (raw === undefined || Number.isNaN(limit)) return;
    setBusyId(q.id);
    setMsg(null);
    try {
      await apiFetch(`/quotas/${q.id}`, {
        method: "PATCH",
        body: JSON.stringify({ limit, version: q.version }),
      });
      setMsg({ tone: "success", text: `${q.user_name} 한도를 ${limit}로 변경했습니다.` });
      setEdits((e) => {
        const next = { ...e };
        delete next[q.id];
        return next;
      });
      refetch();
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.status === 409
            ? "다른 곳에서 먼저 수정되었습니다. 새로고침 후 다시 시도하세요."
            : err.message
          : "변경에 실패했습니다.";
      setMsg({ tone: "error", text });
    } finally {
      setBusyId(null);
    }
  }

  const quotas = data ?? [];

  return (
    <div>
      <TraceBar
        screen="팀 Quota 관리 (M2)"
        api="GET /teams/{id}/quotas · PATCH /quotas/{id}"
        feature="F12 · F13"
        uc="UC10"
        entity="Quota · User"
      />
      <PageHead title="팀 Quota 관리" desc="팀원별 한도를 조정합니다. 현재 사용량보다 낮추거나 팀 합계를 넘을 수 없습니다." actions={<Button onClick={refetch}>↻ 새로고침</Button>} />

      {msg && (
        <div className="mb-3">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}
      {loading && <Spinner />}
      {error && <Notice tone="error">Quota를 불러오지 못했습니다. {error.message}</Notice>}

      {!loading && !error && (
        <Table
          head={
            <>
              <Th>팀원</Th>
              <Th>사용량</Th>
              <Th>한도</Th>
              <Th />
            </>
          }
        >
          {quotas.length === 0 ? (
            <tr>
              <Td className="text-center text-[var(--mut)]">팀원 Quota가 없습니다.</Td>
            </tr>
          ) : (
            quotas.map((q) => {
              const editing = edits[q.id] !== undefined;
              return (
                <tr key={q.id} className="hover:bg-[#fbfcfe]">
                  <Td className="font-semibold">{q.user_name}</Td>
                  <Td className="font-mono text-[12px]">{q.used}</Td>
                  <Td>
                    <Input
                      aria-label={`${q.user_name} 한도`}
                      type="number"
                      min={q.used}
                      value={editing ? edits[q.id] : String(q.limit)}
                      onChange={(e) => setEdits((s) => ({ ...s, [q.id]: e.target.value }))}
                      className="w-24 py-1.5"
                    />
                  </Td>
                  <Td>
                    <Button variant="pri" disabled={!editing || busyId === q.id} onClick={() => save(q)}>
                      저장
                    </Button>
                  </Td>
                </tr>
              );
            })
          )}
        </Table>
      )}
    </div>
  );
}
