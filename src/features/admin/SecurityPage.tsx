import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { RefreshBar } from "@/components/ui/RefreshBar";
import { Spinner } from "@/components/ui/Spinner";
import { KpiTile, Panel, StatusChip } from "@/components/viz";
import type { StatusTone } from "@/components/viz";
import { useApi } from "@/hooks/useApi";
import { apiFetch, ApiError } from "@/lib/api";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import type {
  SecurityAlert,
  SecurityAlertStatus,
  SecurityAlertType,
  SecurityEvent,
  SecurityEventType,
  SecuritySeverity,
  SecuritySummary,
} from "@/types/api";

// 보안 요약 KPI는 5초 주기로 폴링한다(탐지 잡 주기와 동기화).
const POLL_MS = 5_000;

// severity → StatusChip tone 매핑.
// INFO는 배경색을 요하지 않는 일반 정보 이므로 "info", WARNING은 "warn", CRITICAL은 "crit".
function severityTone(severity: SecuritySeverity): StatusTone {
  if (severity === "CRITICAL") return "crit";
  if (severity === "WARNING") return "warn";
  return "info";
}

// alert status → StatusChip tone 매핑.
function alertStatusTone(status: SecurityAlertStatus): StatusTone {
  return status === "OPEN" ? "warn" : "ok";
}

// 보안 경보 유형 한글 라벨.
const ALERT_TYPE_LABEL: Record<SecurityAlertType, string> = {
  BRUTE_FORCE: "브루트포스",
  ACCESS_ABUSE: "접근 남용",
  AGENT_DOWN: "에이전트 다운",
  ADMIN_ABUSE: "관리자 남용",
};

// 보안 이벤트 유형 한글 라벨.
const EVENT_TYPE_LABEL: Record<SecurityEventType, string> = {
  LOGIN_FAILURE: "로그인 실패",
  ACCOUNT_LOCKED: "계정 잠금",
  ACCESS_DENIED: "접근 거부",
  ADMIN_ACTION: "관리자 작업",
  AGENT_UNREACHABLE: "에이전트 오류",
};

// 시뮬레이션 시나리오 선택지.
const SCENARIOS = [
  { value: "brute_force", label: "브루트포스" },
  { value: "access_abuse", label: "접근 남용" },
  { value: "agent_down", label: "에이전트 다운" },
  { value: "admin_abuse", label: "관리자 남용" },
] as const;

type Scenario = (typeof SCENARIOS)[number]["value"];

export function SecurityPage() {
  const summary = useApi<SecuritySummary>("/security/summary", POLL_MS);
  const alerts = useApi<SecurityAlert[]>("/security/alerts", POLL_MS);
  const [eventTypeFilter, setEventTypeFilter] = useState<SecurityEventType | "">("");
  const [severityFilter, setSeverityFilter] = useState<SecuritySeverity | "">("");

  // 필터가 바뀔 때마다 쿼리스트링을 다시 조립한다.
  const eventQuery = buildEventQuery(eventTypeFilter, severityFilter);
  const events = useApi<SecurityEvent[]>(eventQuery, POLL_MS);

  const anyLoading = summary.loading || alerts.loading;

  function handleRefresh() {
    summary.refetch();
    alerts.refetch();
    events.refetch();
  }

  return (
    <div>
      <TraceBar
        screen="A4 보안 관제"
        api="GET /security/summary · /security/alerts · /security/events · PATCH /security/alerts/{id}/resolve · POST /security/simulate"
        feature="F36·F37·F38"
        uc="UC26·UC27·UC28"
        entity="SecurityEvent·SecurityAlert"
      />
      <PageHead
        title="보안 관제"
        desc="인증 실패·권한 거부·관리자 작업·에이전트 이상을 실시간으로 추적하고, 탐지된 위협 경보를 해결한다."
        actions={
          <RefreshBar
            lastUpdatedAt={summary.lastUpdatedAt}
            loading={anyLoading}
            onRefresh={handleRefresh}
          />
        }
      />

      {summary.error && (
        <Notice tone="error">보안 요약을 불러오지 못했습니다. {summary.error.message}</Notice>
      )}

      <SecurityKpiStrip data={summary.data} />

      <div className="mt-4 flex flex-col gap-4">
        <AlertsPanel
          data={alerts.data}
          loading={alerts.loading}
          error={!!alerts.error}
          onResolved={() => { alerts.refetch(); summary.refetch(); }}
        />

        <EventsPanel
          data={events.data}
          loading={events.loading}
          error={!!events.error}
          eventTypeFilter={eventTypeFilter}
          severityFilter={severityFilter}
          onEventTypeChange={setEventTypeFilter}
          onSeverityChange={setSeverityFilter}
        />
      </div>
    </div>
  );
}

// 이벤트 목록 API 경로를 필터 상태로부터 조립한다.
function buildEventQuery(
  eventType: SecurityEventType | "",
  severity: SecuritySeverity | "",
): string {
  const params = new URLSearchParams();
  if (eventType) params.set("eventType", eventType);
  if (severity) params.set("severity", severity);
  const qs = params.toString();
  return `/security/events${qs ? `?${qs}` : ""}`;
}

// --- KPI 스트립 ---

function SecurityKpiStrip({ data }: { data: SecuritySummary | null }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <KpiTile label="오늘 이벤트" value={data?.todayEvents ?? "—"} />
      <KpiTile
        label="미해결 경보"
        value={data?.openAlerts ?? "—"}
        deltaTone={data && data.openAlerts > 0 ? "down" : "neutral"}
        delta={data ? (data.openAlerts > 0 ? "조치 필요" : "안정") : undefined}
      />
      <KpiTile
        label="Critical 경보"
        value={data?.criticalAlerts ?? "—"}
        deltaTone={data && data.criticalAlerts > 0 ? "down" : "neutral"}
      />
      <KpiTile
        label="브루트포스 의심"
        value={data?.bruteForceSuspects ?? "—"}
        deltaTone={data && data.bruteForceSuspects > 0 ? "down" : "neutral"}
      />
    </div>
  );
}

// --- 보안 경보 패널 ---

function AlertsPanel({
  data,
  loading,
  error,
  onResolved,
}: {
  data: SecurityAlert[] | null;
  loading: boolean;
  error: boolean;
  onResolved: () => void;
}) {
  const [resolving, setResolving] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [simScenario, setSimScenario] = useState<Scenario>("brute_force");
  const [simBusy, setSimBusy] = useState(false);

  async function handleResolve(id: number) {
    setResolving(id);
    setActionMsg(null);
    try {
      await apiFetch<SecurityAlert>(`/security/alerts/${id}/resolve`, { method: "PATCH" });
      setActionMsg({ tone: "success", text: `경보 #${id}을 해결 처리했습니다.` });
      onResolved();
    } catch (err) {
      const text = err instanceof ApiError ? err.message : "해결 처리에 실패했습니다.";
      setActionMsg({ tone: "error", text });
    } finally {
      setResolving(null);
    }
  }

  async function handleSimulate() {
    setSimBusy(true);
    setActionMsg(null);
    try {
      const result = await apiFetch<{ inserted: number; scenario: string }>(
        "/security/simulate",
        { method: "POST", body: JSON.stringify({ scenario: simScenario }) },
      );
      setActionMsg({
        tone: "success",
        text: `시뮬레이션 완료: 이벤트 ${result.inserted}건 삽입. 다음 탐지 주기에 경보가 발생합니다.`,
      });
      onResolved();
    } catch (err) {
      const text = err instanceof ApiError ? err.message : "시뮬레이션에 실패했습니다.";
      setActionMsg({ tone: "error", text });
    } finally {
      setSimBusy(false);
    }
  }

  return (
    <Panel
      title="보안 경보"
      sub="OPEN 경보만 표시합니다. 해결 처리 후 경보 상태가 RESOLVED로 변경됩니다."
    >
      {actionMsg && (
        <div className="mb-3">
          <Notice tone={actionMsg.tone}>{actionMsg.text}</Notice>
        </div>
      )}

      {loading && !data && <Spinner />}
      {error && <Notice tone="error">보안 경보를 불러오지 못했습니다.</Notice>}

      {data && <AlertList alerts={data} resolving={resolving} onResolve={handleResolve} />}

      {/* 공격 시뮬레이션 — 데모 전용 */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--g-bd)] pt-4">
        <span className="text-[12px] text-[var(--g-mut)]">공격 시뮬레이션 (데모)</span>
        <select
          className="rounded-md border border-[var(--g-bd)] bg-[var(--g-pan)] px-2 py-1 text-[13px] text-[var(--g-tx)]"
          value={simScenario}
          onChange={(e) => setSimScenario(e.target.value as Scenario)}
          disabled={simBusy}
        >
          {SCENARIOS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <Button variant="outline" disabled={simBusy} onClick={handleSimulate}>
          {simBusy ? "실행 중…" : "시뮬레이션 실행"}
        </Button>
      </div>
    </Panel>
  );
}

function AlertList({
  alerts,
  resolving,
  onResolve,
}: {
  alerts: SecurityAlert[];
  resolving: number | null;
  onResolve: (id: number) => void;
}) {
  const openAlerts = alerts.filter((a) => a.status === "OPEN");

  if (openAlerts.length === 0) {
    return (
      <p className="py-4 text-center text-[13px] text-[var(--g-mut)]">
        미해결 경보가 없습니다.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {openAlerts.map((alert) => (
        <li
          key={alert.id}
          className="flex flex-wrap items-start gap-3 rounded-[7px] border border-[var(--g-bd)] bg-[var(--g-pan2)] px-3 py-2.5"
        >
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusChip tone={severityTone(alert.severity)} label={alert.severity} />
              <StatusChip tone={alertStatusTone(alert.status)} label={alert.status} />
              <span className="font-semibold text-[13px] text-[var(--g-tx)]">
                {ALERT_TYPE_LABEL[alert.alertType]}
              </span>
              <span className="font-mono text-[12px] text-[var(--g-mut)]">#{alert.id}</span>
            </div>
            <p className="mt-1.5 text-[12.5px] text-[var(--g-tx)]">{alert.message}</p>
            <div className="mt-1 text-[11.5px] text-[var(--g-mut)]">
              주체: {alert.subject} · 이벤트 {alert.eventCount}건 ·{" "}
              {new Date(alert.startedAt).toLocaleString("ko-KR")}
            </div>
          </div>
          <Button
            variant="outline"
            disabled={resolving === alert.id}
            onClick={() => onResolve(alert.id)}
          >
            {resolving === alert.id ? "처리 중…" : "해결"}
          </Button>
        </li>
      ))}
    </ul>
  );
}

// --- 보안 이벤트 테이블 ---

function EventsPanel({
  data,
  loading,
  error,
  eventTypeFilter,
  severityFilter,
  onEventTypeChange,
  onSeverityChange,
}: {
  data: SecurityEvent[] | null;
  loading: boolean;
  error: boolean;
  eventTypeFilter: SecurityEventType | "";
  severityFilter: SecuritySeverity | "";
  onEventTypeChange: (v: SecurityEventType | "") => void;
  onSeverityChange: (v: SecuritySeverity | "") => void;
}) {
  return (
    <Panel
      title="보안 이벤트"
      sub="최근 100건. 유형·심각도로 필터링합니다."
      right={
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="rounded-md border border-[var(--g-bd)] bg-[var(--g-pan)] px-2 py-1 text-[12px] text-[var(--g-tx)]"
            value={eventTypeFilter}
            onChange={(e) => onEventTypeChange(e.target.value as SecurityEventType | "")}
          >
            <option value="">유형: 전체</option>
            {(Object.keys(EVENT_TYPE_LABEL) as SecurityEventType[]).map((t) => (
              <option key={t} value={t}>
                {EVENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-[var(--g-bd)] bg-[var(--g-pan)] px-2 py-1 text-[12px] text-[var(--g-tx)]"
            value={severityFilter}
            onChange={(e) => onSeverityChange(e.target.value as SecuritySeverity | "")}
          >
            <option value="">심각도: 전체</option>
            <option value="INFO">INFO</option>
            <option value="WARNING">WARNING</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
        </div>
      }
    >
      {loading && !data && <Spinner />}
      {error && <Notice tone="error">보안 이벤트를 불러오지 못했습니다.</Notice>}
      {data && <EventTable events={data} />}
    </Panel>
  );
}

function EventTable({ events }: { events: SecurityEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-[13px] text-[var(--g-mut)]">
        조건에 맞는 이벤트가 없습니다.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-[var(--g-bd)] text-left text-[11px] uppercase tracking-wide text-[var(--g-mut)]">
            <th className="py-2 pr-4 font-semibold whitespace-nowrap">시각</th>
            <th className="py-2 pr-4 font-semibold whitespace-nowrap">유형</th>
            <th className="py-2 pr-4 font-semibold whitespace-nowrap">Actor / 식별자</th>
            <th className="py-2 pr-4 font-semibold whitespace-nowrap">IP</th>
            <th className="py-2 font-semibold whitespace-nowrap">심각도</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <EventRow key={ev.id} event={ev} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventRow({ event }: { event: SecurityEvent }) {
  // actor가 없으면 identifier(시도 이메일 등)를 표시한다.
  const actorLabel = event.actorId
    ? `#${event.actorId}`
    : (event.identifier ?? "—");

  return (
    <tr className="border-b border-[var(--g-bd)] last:border-0">
      <td className="py-2 pr-4 font-mono text-[12px] tnum text-[var(--g-mut)] whitespace-nowrap">
        {new Date(event.occurredAt).toLocaleString("ko-KR")}
      </td>
      <td className="py-2 pr-4 whitespace-nowrap">
        {EVENT_TYPE_LABEL[event.eventType]}
      </td>
      <td className="py-2 pr-4 text-[var(--g-tx)]">{actorLabel}</td>
      <td className="py-2 pr-4 font-mono text-[12px] text-[var(--g-mut)]">
        {event.sourceIp ?? "—"}
      </td>
      <td className="py-2">
        <StatusChip tone={severityTone(event.severity)} label={event.severity} />
      </td>
    </tr>
  );
}
