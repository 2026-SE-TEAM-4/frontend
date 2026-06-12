import { Link } from "react-router-dom";

import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/context/AuthContext";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { Notification, Reservation, ServerListResponse } from "@/types/api";

const ACTIVE = ["RESERVED", "IN_USE"];

function Stat({ value, label, to, color }: { value: number; label: string; to: string; color: string }) {
  return (
    <Link
      to={to}
      className="flex-1 border-r border-[var(--bd2)] px-4 py-3 last:border-r-0 hover:bg-[var(--soft)]"
    >
      <div className="font-mono text-[24px] font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1 text-[12px] text-[var(--mut)]">{label}</div>
    </Link>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const servers = useApi<ServerListResponse>("/servers");
  const reservations = useApi<Reservation[]>("/reservations");
  const notifications = useApi<Notification[]>("/notifications");

  const loading = servers.loading || reservations.loading || notifications.loading;

  const available = (servers.data?.servers ?? []).filter((s) => s.status === "AVAILABLE").length;
  const myActive = (reservations.data ?? []).filter((r) => ACTIVE.includes(r.status)).length;
  const unread = (notifications.data ?? []).filter((n) => n.read_at === null).length;

  return (
    <div>
      <TraceBar
        screen="대시보드 (S1)"
        api="GET /servers · /reservations · /notifications"
        feature="F01 · F03 · F17"
        uc="UC01 · UC02 · UC03"
        entity="Server · Reservation · Notification"
      />
      <PageHead title={`안녕하세요, ${user?.name ?? ""}님`} desc="지금 빌릴 수 있는 서버와 내 예약·알림을 한눈에." />

      {loading ? (
        <Spinner />
      ) : (
        <>
          <div className="mb-4 flex overflow-hidden rounded-[10px] border border-[var(--bd)] bg-[var(--bg)]">
            <Stat value={available} label="지금 가용한 서버" to="/servers" color="var(--ok)" />
            <Stat value={myActive} label="진행 중인 내 예약" to="/reservations" color="var(--acc)" />
            <Stat value={unread} label="안읽은 알림" to="/alerts" color="var(--dng)" />
          </div>

          <div className="rounded-[10px] border border-[var(--bd)] bg-[var(--bg)] p-4">
            <h2 className="mb-2 text-[13px] font-semibold">최근 알림</h2>
            <ul className="flex flex-col gap-1.5">
              {(notifications.data ?? []).slice(0, 5).map((n) => (
                <li key={n.id} className="text-[12.5px] text-[var(--text2)]">
                  {n.read_at === null ? "● " : "○ "}
                  {n.message}
                </li>
              ))}
              {(notifications.data ?? []).length === 0 && (
                <li className="text-[12.5px] text-[var(--mut)]">알림이 없습니다.</li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
