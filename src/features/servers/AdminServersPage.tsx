import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { Panel, StatusChip, type StatusTone } from "@/components/viz";
import { apiFetch, ApiError } from "@/lib/api";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { ServerListItem, ServerListResponse, ServerStatus } from "@/types/api";

interface Msg {
  tone: "error" | "success";
  text: string;
}

// 백엔드 상태값을 운영 화면 공용 칩의 톤/라벨로 변환한다.
const STATUS_VIEW: Record<ServerStatus, { tone: StatusTone; label: string }> = {
  AVAILABLE: { tone: "ok", label: "정상" },
  RESERVED: { tone: "info", label: "예약" },
  IN_USE: { tone: "inuse", label: "사용중" },
  MAINTENANCE: { tone: "maint", label: "점검" },
};

// 헬스 점수 구간별 색: >=80 초록, 60~79 노랑, <60 빨강.
function healthStyle(score: number | null): { color: string; bd: string; label: string } {
  if (score === null) return { color: "var(--g-mut)", bd: "var(--g-bd)", label: "—" };
  if (score >= 80) return { color: "var(--g-grn)", bd: "var(--g-grnbd)", label: String(score) };
  if (score >= 60) return { color: "var(--g-yel)", bd: "var(--g-yelbd)", label: String(score) };
  return { color: "var(--g-red)", bd: "var(--g-redbd)", label: String(score) };
}

const EMPTY_FORM = { name: "", ip: "", cpuCores: "16", ramGb: "64", gpuModel: "", group: "" };

// 드로어 모드: 닫힘 / 신규 등록 / 기존 서버(편집·점검·삭제) 표시.
type DrawerMode = { kind: "closed" } | { kind: "create" } | { kind: "view"; server: ServerListItem };

export function AdminServersPage() {
  const { data, loading, error, refetch } = useApi<ServerListResponse>("/servers");
  const [drawer, setDrawer] = useState<DrawerMode>({ kind: "closed" });
  const [form, setForm] = useState(EMPTY_FORM);
  const [maint, setMaint] = useState({ startAt: "", endAt: "", reason: "" });
  const [msg, setMsg] = useState<Msg | null>(null);
  const [busy, setBusy] = useState(false);

  function show(tone: Msg["tone"], text: string) {
    setMsg({ tone, text });
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setMsg(null);
    setDrawer({ kind: "create" });
  }

  function openView(server: ServerListItem) {
    setMaint({ startAt: "", endAt: "", reason: "" });
    setMsg(null);
    setDrawer({ kind: "view", server });
  }

  function closeDrawer() {
    setDrawer({ kind: "closed" });
  }

  async function createServer(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch("/servers", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          ip: form.ip,
          cpuCores: Number(form.cpuCores),
          ramGb: Number(form.ramGb),
          gpuModel: form.gpuModel || null,
          group: form.group || null,
        }),
      });
      show("success", `서버 ${form.name} 등록 완료.`);
      setForm(EMPTY_FORM);
      closeDrawer();
      refetch();
    } catch (err) {
      show("error", err instanceof ApiError ? err.message : "등록 실패");
    } finally {
      setBusy(false);
    }
  }

  async function removeServer(id: number, name: string) {
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch(`/servers/${id}`, { method: "DELETE" });
      show("success", `${name} 삭제(soft delete) 완료.`);
      closeDrawer();
      refetch();
    } catch (err) {
      const text = err instanceof ApiError && err.status === 409 ? "활성 예약이 있어 삭제할 수 없습니다." : "삭제 실패";
      show("error", text);
    } finally {
      setBusy(false);
    }
  }

  async function scheduleMaint(e: FormEvent, serverId: number) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch(`/servers/${serverId}/maintenances`, {
        method: "POST",
        body: JSON.stringify({ startAt: maint.startAt, endAt: maint.endAt, reason: maint.reason || null }),
      });
      show("success", "점검 일정 등록 완료.");
      setMaint({ startAt: "", endAt: "", reason: "" });
    } catch (err) {
      const text = err instanceof ApiError && err.status === 409 ? "점검 시간과 겹치는 예약이 있습니다." : "점검 등록 실패";
      show("error", text);
    } finally {
      setBusy(false);
    }
  }

  const servers = data?.servers ?? [];
  const drawerOpen = drawer.kind !== "closed";

  return (
    <div>
      <TraceBar
        screen="서버 관리 (A2)"
        api="POST /servers · DELETE /servers/{id} · POST .../maintenances"
        feature="F14 · F15 · F16"
        uc="UC11 · UC12 · UC13"
        entity="Server · MaintenanceSchedule"
      />

      <div className="flex items-start justify-between gap-3">
        <PageHead title="서버 관리" desc="서버를 등록·삭제하고 점검 일정을 잡습니다." />
        <div className="mt-1 flex items-center gap-3">
          <span className="font-mono text-[12px] text-[var(--g-mut)] tnum">총 {servers.length}대</span>
          <Button variant="pri" onClick={openCreate}>+ 서버 추가</Button>
        </div>
      </div>

      {msg && (
        <div className="mb-3">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}

      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          {loading && <Spinner />}
          {error && <Notice tone="error">서버 목록을 불러오지 못했습니다. {error.message}</Notice>}

          {!loading && !error && (
            <div className="overflow-hidden rounded-lg border border-[var(--g-bd)] bg-[var(--g-pan)]">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="border-b border-[var(--g-bd)] bg-[var(--g-pan2)] text-left">
                    <th className="px-3 py-2 font-semibold text-[var(--g-mut)]">서버</th>
                    <th className="px-3 py-2 font-semibold text-[var(--g-mut)]">IP</th>
                    <th className="px-3 py-2 font-semibold text-[var(--g-mut)]">스펙</th>
                    <th className="px-3 py-2 font-semibold text-[var(--g-mut)]">상태</th>
                    <th className="px-3 py-2 font-semibold text-[var(--g-mut)]">헬스</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {servers.map((s) => {
                    const sv = STATUS_VIEW[s.status];
                    const hs = healthStyle(s.healthScore);
                    const selected = drawer.kind === "view" && drawer.server.id === s.id;
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-[var(--g-bd)] last:border-0"
                        style={selected ? { background: "var(--g-pan2)" } : undefined}
                      >
                        <td className="px-3 py-2.5 font-semibold text-[var(--g-tx)]">{s.name}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--g-mut)] tnum">{s.ip ?? "—"}</td>
                        <td className="px-3 py-2.5 font-mono text-[12px] text-[var(--g-mut)] tnum">
                          {s.spec.cpuCores}C · {s.spec.ramGb}GB{s.spec.gpuModel ? ` · ${s.spec.gpuModel}` : ""}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusChip tone={sv.tone} label={sv.label} />
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="inline-flex min-w-[2.25rem] justify-center rounded-md border px-2 py-0.5 font-mono text-[12px] font-bold tnum"
                            style={{ color: hs.color, borderColor: hs.bd }}
                          >
                            {hs.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button onClick={() => openView(s)}>편집</Button>
                        </td>
                      </tr>
                    );
                  })}
                  {servers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-[13px] text-[var(--g-mut)]">
                        등록된 서버가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {drawerOpen && (
          <aside className="w-[360px] shrink-0">
            {drawer.kind === "create" && (
              <Panel
                title="서버 추가"
                sub="신규 서버를 인벤토리에 등록합니다."
                right={<Button onClick={closeDrawer} aria-label="닫기">닫기</Button>}
              >
                <form onSubmit={createServer}>
                  <Field label="이름" htmlFor="s-name">
                    <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </Field>
                  <Field label="IP" htmlFor="s-ip">
                    <Input id="s-ip" value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="10.0.0.x" required />
                  </Field>
                  <div className="grid grid-cols-2 gap-x-3">
                    <Field label="vCPU" htmlFor="s-cpu">
                      <Input id="s-cpu" type="number" min={1} value={form.cpuCores} onChange={(e) => setForm({ ...form, cpuCores: e.target.value })} required />
                    </Field>
                    <Field label="RAM(GB)" htmlFor="s-ram">
                      <Input id="s-ram" type="number" min={1} value={form.ramGb} onChange={(e) => setForm({ ...form, ramGb: e.target.value })} required />
                    </Field>
                  </div>
                  <Field label="GPU 모델" htmlFor="s-gpu">
                    <Input id="s-gpu" value={form.gpuModel} onChange={(e) => setForm({ ...form, gpuModel: e.target.value })} placeholder="RTX4090" />
                  </Field>
                  <Field label="그룹" htmlFor="s-group">
                    <Input id="s-group" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="Lab-A GPU" />
                  </Field>
                  <Button type="submit" variant="pri" disabled={busy} className="w-full">서버 등록</Button>
                </form>
              </Panel>
            )}

            {drawer.kind === "view" && (
              <DrawerView
                server={drawer.server}
                maint={maint}
                setMaint={setMaint}
                busy={busy}
                onClose={closeDrawer}
                onSchedule={(e) => scheduleMaint(e, drawer.server.id)}
                onDelete={() => removeServer(drawer.server.id, drawer.server.name)}
              />
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

interface DrawerViewProps {
  server: ServerListItem;
  maint: { startAt: string; endAt: string; reason: string };
  setMaint: (m: { startAt: string; endAt: string; reason: string }) => void;
  busy: boolean;
  onClose: () => void;
  onSchedule: (e: FormEvent) => void;
  onDelete: () => void;
}

// 편집 드로어: 서버 정보 + 점검 예약 + 위험 구역(삭제).
// 백엔드에 서버 수정(PUT/PATCH) 엔드포인트가 없어 정보는 읽기 전용으로 표시한다.
function DrawerView({ server, maint, setMaint, busy, onClose, onSchedule, onDelete }: DrawerViewProps) {
  const sv = STATUS_VIEW[server.status];
  const hs = healthStyle(server.healthScore);
  return (
    <Panel
      title={server.name}
      sub="서버 정보 · 점검 · 삭제"
      right={<Button onClick={onClose} aria-label="닫기">닫기</Button>}
    >
      <div className="mb-4 space-y-2 text-[12px]">
        <InfoRow label="상태">
          <StatusChip tone={sv.tone} label={sv.label} />
        </InfoRow>
        <InfoRow label="헬스">
          <span className="font-mono font-bold tnum" style={{ color: hs.color }}>{hs.label}</span>
        </InfoRow>
        <InfoRow label="스펙">
          <span className="font-mono text-[var(--g-tx)] tnum">
            {server.spec.cpuCores}C · {server.spec.ramGb}GB{server.spec.gpuModel ? ` · ${server.spec.gpuModel}` : ""}
          </span>
        </InfoRow>
        <InfoRow label="점유자">
          <span className="text-[var(--g-tx)]">{server.occupant ?? "—"}</span>
        </InfoRow>
      </div>

      <div className="mb-4 border-t border-[var(--g-bd)] pt-4">
        <h3 className="mb-2.5 text-[13px] font-semibold text-[var(--g-tx)]">점검 예약</h3>
        <form onSubmit={onSchedule}>
          <div className="grid grid-cols-2 gap-x-3">
            <Field label="시작" htmlFor="m-start">
              <Input id="m-start" type="datetime-local" value={maint.startAt} onChange={(e) => setMaint({ ...maint, startAt: e.target.value })} required />
            </Field>
            <Field label="종료" htmlFor="m-end">
              <Input id="m-end" type="datetime-local" value={maint.endAt} onChange={(e) => setMaint({ ...maint, endAt: e.target.value })} required />
            </Field>
          </div>
          <Field label="사유" htmlFor="m-reason">
            <Input id="m-reason" value={maint.reason} onChange={(e) => setMaint({ ...maint, reason: e.target.value })} placeholder="디스크 교체" />
          </Field>
          <Button type="submit" variant="pri" disabled={busy} className="w-full">점검 등록</Button>
        </form>
      </div>

      <div
        className="rounded-md border p-3"
        style={{ borderColor: "var(--g-redbd)", background: "var(--g-pan2)" }}
      >
        <h3 className="text-[13px] font-semibold" style={{ color: "var(--g-red)" }}>위험 구역</h3>
        <p className="mt-1 mb-2.5 text-[12px] text-[var(--g-mut)]">
          서버를 삭제(soft delete)합니다. 활성 예약이 있으면 삭제되지 않습니다.
        </p>
        <Button variant="danger" disabled={busy} aria-label={`${server.name} 삭제`} onClick={onDelete} className="w-full">
          서버 삭제
        </Button>
      </div>
    </Panel>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--g-mut)]">{label}</span>
      {children}
    </div>
  );
}
