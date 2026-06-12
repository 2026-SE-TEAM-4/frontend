import { Routes, Route } from "react-router-dom";

import { AppShell } from "@/layout/AppShell";
import { RequireAuth } from "@/routes/RequireAuth";
import { RequireRole } from "@/routes/RequireRole";
import { LoginPage } from "@/features/auth/LoginPage";
import { SignupPage } from "@/features/auth/SignupPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ServerListPage } from "@/features/servers/ServerListPage";
import { ServerDetailPage } from "@/features/servers/ServerDetailPage";
import { AdminServersPage } from "@/features/servers/AdminServersPage";
import { ReservePage } from "@/features/reservations/ReservePage";
import { MyReservationsPage } from "@/features/reservations/MyReservationsPage";
import { TeamUsagePage } from "@/features/reservations/TeamUsagePage";
import { AlertsPage } from "@/features/notifications/AlertsPage";
import { ApprovalsPage } from "@/features/approvals/ApprovalsPage";
import { QuotaPage } from "@/features/quota/QuotaPage";
import { OpsDashboardPage } from "@/features/ops/OpsDashboardPage";
import { AvailabilityPage } from "@/features/ops/AvailabilityPage";
import { AiopsPage } from "@/features/ops/AiopsPage";
import { AccountsPage } from "@/features/admin/AccountsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/servers" element={<ServerListPage />} />
          <Route path="/servers/:id" element={<ServerDetailPage />} />
          <Route path="/servers/:id/reserve" element={<ReservePage />} />
          <Route path="/reservations" element={<MyReservationsPage />} />
          <Route path="/alerts" element={<AlertsPage />} />

          {/* 팀 관리 (MGR·ADM) */}
          <Route element={<RequireRole roles={["MGR", "ADM"]} />}>
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/quota" element={<QuotaPage />} />
            <Route path="/team-usage" element={<TeamUsagePage />} />
          </Route>

          {/* 서버 운영 (ADM) */}
          <Route element={<RequireRole roles={["ADM"]} />}>
            <Route path="/ops" element={<OpsDashboardPage />} />
            <Route path="/ops/availability" element={<AvailabilityPage />} />
            <Route path="/ops/aiops" element={<AiopsPage />} />
            <Route path="/admin/servers" element={<AdminServersPage />} />
            <Route path="/admin/accounts" element={<AccountsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
