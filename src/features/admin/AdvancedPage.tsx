import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { apiFetch, ApiError } from "@/lib/api";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";

interface ResetResult {
  deleted: number;
  message: string;
}

interface ResetAction {
  id: string;
  label: string;
  desc: string;
  endpoint: string;
  danger: boolean;
}

const RESET_ACTIONS: ResetAction[] = [
  {
    id: "availability",
    label: "가용성 히스토리 초기화",
    desc: "ServerMetric과 ServerHealthHistory를 삭제합니다. 이후 스케줄러가 재수집합니다.",
    endpoint: "/admin/reset/availability",
    danger: false,
  },
  {
    id: "aiops",
    label: "AIOps 데이터 초기화",
    desc: "인시던트, 이상 기록, LLM 요약, 예측, 스케줄러 로그를 삭제합니다.",
    endpoint: "/admin/reset/aiops",
    danger: false,
  },
  {
    id: "notifications",
    label: "알림·감사 로그 초기화",
    desc: "모든 사용자의 알림과 감사 로그를 삭제합니다.",
    endpoint: "/admin/reset/notifications",
    danger: false,
  },
  {
    id: "reservations",
    label: "예약·승인·대기열 초기화",
    desc: "예약, 승인 요청, 대기열, 점검 스케줄을 삭제합니다.",
    endpoint: "/admin/reset/reservations",
    danger: false,
  },
  {
    id: "all",
    label: "전체 운영 데이터 초기화",
    desc: "계정·팀·Quota·서버 마스터 데이터를 제외한 모든 운영 데이터를 삭제합니다. 되돌릴 수 없습니다.",
    endpoint: "/admin/reset/all",
    danger: true,
  },
];

interface ActionState {
  busy: boolean;
  confirm: boolean;
  result: { tone: "success" | "error"; text: string } | null;
}

function ResetCard({ action }: { action: ResetAction }) {
  const [state, setState] = useState<ActionState>({ busy: false, confirm: false, result: null });

  async function execute() {
    setState((s) => ({ ...s, busy: true, result: null }));
    try {
      const data = await apiFetch<ResetResult>(action.endpoint, { method: "POST" });
      setState({ busy: false, confirm: false, result: { tone: "success", text: data.message } });
    } catch (err) {
      const text = err instanceof ApiError ? err.message : "초기화에 실패했습니다.";
      setState({ busy: false, confirm: false, result: { tone: "error", text } });
    }
  }

  function handleClick() {
    if (action.danger && !state.confirm) {
      setState((s) => ({ ...s, confirm: true }));
      return;
    }
    void execute();
  }

  function cancelConfirm() {
    setState((s) => ({ ...s, confirm: false }));
  }

  return (
    <div className="rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-5">
      <p className="mb-0.5 text-[13.5px] font-semibold">{action.label}</p>
      <p className="mb-3 text-[12px] text-[var(--mut)]">{action.desc}</p>

      {state.result && (
        <div className="mb-3">
          <Notice tone={state.result.tone}>{state.result.text}</Notice>
        </div>
      )}

      {state.confirm ? (
        <div className="flex gap-2">
          <Button variant="danger" disabled={state.busy} onClick={handleClick}>
            {state.busy ? "처리 중…" : "확인 — 정말 삭제"}
          </Button>
          <Button variant="outline" onClick={cancelConfirm}>
            취소
          </Button>
        </div>
      ) : (
        <Button
          variant={action.danger ? "danger" : "default"}
          disabled={state.busy}
          onClick={handleClick}
        >
          {state.busy ? "처리 중…" : "초기화"}
        </Button>
      )}
    </div>
  );
}

export function AdvancedPage() {
  return (
    <div>
      <TraceBar
        screen="고급 관리"
        api="POST /admin/reset/*"
        feature="F35"
        uc="—"
        entity="운영 데이터"
      />
      <PageHead
        title="고급 관리"
        desc="데모·테스트 환경을 위한 운영 데이터 초기화 도구입니다. 계정·팀·서버 마스터 데이터는 영향받지 않습니다."
      />

      <div className="flex max-w-[560px] flex-col gap-3">
        {RESET_ACTIONS.map((action) => (
          <ResetCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  );
}
