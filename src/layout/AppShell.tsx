import { Outlet } from "react-router-dom";

import { useApi } from "@/hooks/useApi";
import { useNotificationsSocket } from "@/hooks/useNotificationsSocket";
import type { Notification } from "@/types/api";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  const { data, refetch } = useApi<Notification[]>("/notifications", 10_000);
  useNotificationsSocket(refetch);
  const unread = (data ?? []).filter((n) => n.read_at === null).length;

  return (
    <div className="min-h-screen">
      <Topbar unread={unread} />
      <div className="flex min-h-[calc(100vh-52px)]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 pb-14 pt-[18px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
