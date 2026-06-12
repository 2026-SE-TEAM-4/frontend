import { Outlet } from "react-router-dom";

import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell() {
  return (
    <div className="min-h-screen">
      <Topbar />
      <div className="flex min-h-[calc(100vh-52px)]">
        <Sidebar />
        <main className="min-w-0 flex-1 px-6 pb-14 pt-[18px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
