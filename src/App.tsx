import { Routes, Route } from "react-router-dom";

import { ComingSoon } from "@/components/ComingSoon";
import { AppShell } from "@/layout/AppShell";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";
import { LoginPage } from "@/features/auth/LoginPage";
import { SignupPage } from "@/features/auth/SignupPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ServerListPage } from "@/features/servers/ServerListPage";
import { ReservePage } from "@/features/reservations/ReservePage";
import { MyReservationsPage } from "@/features/reservations/MyReservationsPage";
import { AlertsPage } from "@/features/notifications/AlertsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/servers" element={<ServerListPage />} />
          <Route path="/servers/:id/reserve" element={<ReservePage />} />
          <Route path="/reservations" element={<MyReservationsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />

          {/* 역할 전용 화면 — 다음 단계 계획에서 구현 */}
          <Route element={<RequireRole roles={["MGR", "ADM"]} />}>
            <Route path="/approvals" element={<ComingSoon title="승인 요청함" />} />
            <Route path="/quota" element={<ComingSoon title="Quota 관리" />} />
          </Route>
          <Route element={<RequireRole roles={["ADM"]} />}>
            <Route path="/ops" element={<ComingSoon title="운영 대시보드" />} />
            <Route path="/ops/availability" element={<ComingSoon title="가용성 현황" />} />
            <Route path="/ops/aiops" element={<ComingSoon title="AIOps 모니터링" />} />
            <Route path="/admin/servers" element={<ComingSoon title="서버 관리" />} />
            <Route path="/admin/accounts" element={<ComingSoon title="계정 잠금 관리" />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
