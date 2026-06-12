import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { apiFetch, ApiError } from "@/lib/api";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import { useNotificationsSocket } from "@/hooks/useNotificationsSocket";
import type { Notification } from "@/types/api";

export function AlertsPage() {
  const { data, loading, error, refetch } = useApi<Notification[]>("/notifications");
  const [busyId, setBusyId] = useState<number | null>(null);
  useNotificationsSocket(refetch);

  async function markRead(id: number) {
    setBusyId(id);
    try {
      await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      refetch();
    } catch {
      // 읽음 처리 실패는 조용히 무시(다음 새로고침에 반영)
    } finally {
      setBusyId(null);
    }
  }

  const notifications = data ?? [];

  return (
    <div>
      <TraceBar
        screen="알림 (S6)"
        api="GET /notifications · PATCH .../read · WS /ws/notifications"
        feature="F17 · F18 · F19"
        uc="UC03-a"
        entity="Notification"
      />
      <PageHead title="알림" desc="승인 결과·회수·만료 알림을 실시간으로 받습니다." actions={<Button onClick={refetch}>↻ 새로고침</Button>} />

      {loading && <Spinner />}
      {error && <Notice tone="error">알림을 불러오지 못했습니다. {(error as ApiError).message}</Notice>}

      {!loading && !error && (
        <div className="flex flex-col gap-2">
          {notifications.length === 0 && (
            <p className="py-8 text-center text-[13px] text-[var(--mut)]">알림이 없습니다.</p>
          )}
          {notifications.map((n) => {
            const unread = n.read_at === null;
            return (
              <div
                key={n.id}
                className={`flex items-center gap-3 rounded-lg border px-3.5 py-3 ${
                  unread ? "border-[#9ec3ff] bg-[var(--accs)]" : "border-[var(--bd2)] bg-[var(--bg)]"
                }`}
              >
                {unread && <span className="h-2 w-2 flex-none rounded-full bg-[var(--acc)]" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium text-[var(--text)]">{n.message}</div>
                  <div className="font-mono text-[11px] text-[var(--mut)]">{n.type}</div>
                </div>
                {unread && (
                  <Button disabled={busyId === n.id} onClick={() => markRead(n.id)}>
                    읽음
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
