import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch, ApiError } from "@/lib/api";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { ServerAlternativeResponse, ServerDetailResponse } from "@/types/api";

export function ReservePage() {
  const { id } = useParams();
  const serverId = Number(id);
  const navigate = useNavigate();
  const { data: server, loading } = useApi<ServerDetailResponse>(`/servers/${serverId}`);

  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [alternatives, setAlternatives] = useState<ServerAlternativeResponse["alternatives"] | null>(null);
  const [needApproval, setNeedApproval] = useState(false);

  async function handleReserve(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setAlternatives(null);
    setBusy(true);
    try {
      await apiFetch("/reservations", {
        method: "POST",
        body: JSON.stringify({ serverId, startTime, endTime }),
      });
      navigate("/reservations", { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("이 서버는 해당 시간에 이미 예약되어 있습니다. 비슷한 사양의 대안 서버를 확인하세요.");
        try {
          const alt = await apiFetch<ServerAlternativeResponse>(
            `/servers/alternatives?serverId=${serverId}`,
          );
          setAlternatives(alt.alternatives);
        } catch {
          setAlternatives([]);
        }
      } else if (err instanceof ApiError && err.status === 422) {
        setNeedApproval(true);
        setError("Quota를 초과했습니다. 팀 관리자에게 승인을 요청할 수 있습니다.");
      } else if (err instanceof ApiError && err.status === 429) {
        setError("요청이 많아 계정이 일시 잠겼습니다. 잠시 후 다시 시도하세요.");
      } else {
        setError(err instanceof ApiError ? err.message : "예약에 실패했습니다.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleApprovalRequest() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/approval-requests", {
        method: "POST",
        body: JSON.stringify({ serverId, startTime, endTime, reason }),
      });
      navigate("/reservations", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "승인 요청에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <TraceBar
        screen="예약 생성 (S4)"
        api="POST /reservations"
        feature="F04"
        uc="UC04 · UC05 · UC08"
        entity="Reservation · Server · Quota"
      />
      <PageHead
        title={`예약 — ${server?.name ?? `서버 #${serverId}`}`}
        desc="기간을 선택해 예약합니다. 충돌 시 대안 서버를, Quota 초과 시 승인 요청을 안내합니다."
      />

      <div className="max-w-[520px]">
        <form onSubmit={handleReserve} className="rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-5">
          {server && (
            <p className="mb-4 font-mono text-[12px] text-[var(--mut)]">
              {server.spec.cpuCores}C · {server.spec.ramGb}GB
              {server.spec.gpuModel ? ` · ${server.spec.gpuModel}` : ""} · 상태 {server.status}
            </p>
          )}
          <Field label="시작 시각" htmlFor="start">
            <Input id="start" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
          </Field>
          <Field label="종료 시각" htmlFor="end">
            <Input id="end" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
          </Field>

          {error && (
            <div className="mb-3.5">
              <Notice tone={needApproval ? "warn" : "error"}>{error}</Notice>
            </div>
          )}

          {!needApproval && (
            <Button type="submit" variant="pri" className="w-full py-2.5" disabled={busy}>
              {busy ? "처리 중…" : "예약하기"}
            </Button>
          )}
        </form>

        {alternatives && (
          <div className="mt-4 rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-5">
            <h2 className="mb-3 text-[14px] font-semibold">대안 서버 (유사 사양 · 가용)</h2>
            {alternatives.length === 0 ? (
              <p className="text-[13px] text-[var(--mut)]">지금 쓸 수 있는 대안 서버가 없습니다. 대기열 등록을 고려하세요.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {alternatives.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-lg border border-[var(--bd2)] px-3 py-2">
                    <span className="text-[13px]">
                      <b>{a.name}</b>{" "}
                      <span className="font-mono text-[11.5px] text-[var(--mut)]">
                        {a.spec.cpuCores}C · {a.spec.ramGb}GB
                      </span>
                    </span>
                    <Button variant="outline" onClick={() => navigate(`/servers/${a.id}/reserve`)}>
                      이 서버로
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {needApproval && (
          <div className="mt-4 rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-5">
            <h2 className="mb-3 text-[14px] font-semibold">승인 요청</h2>
            <Field label="사유" htmlFor="reason">
              <Input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 논문 실험" />
            </Field>
            <Button variant="pri" className="w-full py-2.5" disabled={busy} onClick={handleApprovalRequest}>
              승인 요청 보내기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
