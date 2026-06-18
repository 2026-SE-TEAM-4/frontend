import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import { Notice } from "@/components/ui/Notice";
import { useApi } from "@/hooks/useApi";
import { useNotificationsSocket } from "@/hooks/useNotificationsSocket";
import type { Notification } from "@/types/api";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

const DENIED_VISIBLE_MS = 4000;

export function AppShell() {
  const { data, refetch } = useApi<Notification[]>("/notifications", 10_000);
  useNotificationsSocket(refetch);
  const unread = (data ?? []).filter((n) => n.read_at === null).length;

  const location = useLocation();
  const navigate = useNavigate();
  const denied = (location.state as { denied?: boolean } | null)?.denied === true;
  const [showDenied, setShowDenied] = useState(false);

  useEffect(() => {
    if (!denied) return;
    setShowDenied(true);
    // 기록 state 를 지워 새로고침·뒤로가기 때 다시 뜨지 않게 한다.
    navigate(location.pathname, { replace: true, state: null });
    const id = setTimeout(() => setShowDenied(false), DENIED_VISIBLE_MS);
    return () => clearTimeout(id);
  }, [denied, navigate, location.pathname]);

  return (
    <div className="min-h-screen">
      <Topbar unread={unread} />
      <div className="flex min-h-[calc(100vh-52px)]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 pb-14 pt-[18px]">
          {showDenied && (
            <div className="mb-4">
              <Notice tone="error">⚠ 권한이 없습니다.</Notice>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
