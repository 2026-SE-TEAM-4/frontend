import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { apiFetch, ApiError } from "@/lib/api";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";

export function AccountsPage() {
  const [userId, setUserId] = useState("");
  const [msg, setMsg] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function unlock(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch(`/users/${Number(userId)}/unlock`, { method: "PATCH" });
      setMsg({ tone: "success", text: `사용자 #${userId} 잠금을 해제했습니다.` });
      setUserId("");
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.status === 404
            ? "해당 사용자를 찾을 수 없습니다."
            : err.message
          : "해제에 실패했습니다.";
      setMsg({ tone: "error", text });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <TraceBar screen="계정 잠금 관리" api="PATCH /users/{id}/unlock" feature="F20" uc="UC20" entity="User" />
      <PageHead
        title="계정 잠금 관리"
        desc="비정상 접근으로 일시 잠긴 계정의 오탐을 해제합니다. 5회 로그인 실패 시 15분 잠금됩니다."
      />

      {msg && (
        <div className="mb-3 max-w-[420px]">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}

      <form onSubmit={unlock} className="max-w-[420px] rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-5">
        <Field label="사용자 ID" htmlFor="uid">
          <Input id="uid" type="number" min={1} value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="예: 4" required />
        </Field>
        <Button type="submit" variant="pri" disabled={busy || !userId}>
          잠금 해제
        </Button>
        <p className="mt-3 text-[11.5px] text-[var(--mut)]">
          참고: 잠긴 사용자 목록 조회는 별도 엔드포인트(GET /users)가 추가되면 표로 노출할 수 있습니다.
        </p>
      </form>
    </div>
  );
}
