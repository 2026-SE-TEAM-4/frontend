import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, Td, Th } from "@/components/ui/Table";
import { apiFetch, ApiError } from "@/lib/api";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { ServerListResponse } from "@/types/api";

interface Msg {
  tone: "error" | "success";
  text: string;
}

export function AdminServersPage() {
  const { data, loading, error, refetch } = useApi<ServerListResponse>("/servers");
  const [form, setForm] = useState({ name: "", ip: "", cpuCores: "16", ramGb: "64", gpuModel: "", group: "" });
  const [maintFor, setMaintFor] = useState<number | null>(null);
  const [maint, setMaint] = useState({ startAt: "", endAt: "", reason: "" });
  const [msg, setMsg] = useState<Msg | null>(null);
  const [busy, setBusy] = useState(false);

  function show(tone: Msg["tone"], text: string) {
    setMsg({ tone, text });
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
      setForm({ name: "", ip: "", cpuCores: "16", ramGb: "64", gpuModel: "", group: "" });
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
      refetch();
    } catch (err) {
      const text = err instanceof ApiError && err.status === 409 ? "활성 예약이 있어 삭제할 수 없습니다." : "삭제 실패";
      show("error", text);
    } finally {
      setBusy(false);
    }
  }

  async function scheduleMaint(e: FormEvent) {
    e.preventDefault();
    if (maintFor === null) return;
    setBusy(true);
    setMsg(null);
    try {
      await apiFetch(`/servers/${maintFor}/maintenances`, {
        method: "POST",
        body: JSON.stringify({ startAt: maint.startAt, endAt: maint.endAt, reason: maint.reason || null }),
      });
      show("success", "점검 일정 등록 완료.");
      setMaintFor(null);
      setMaint({ startAt: "", endAt: "", reason: "" });
    } catch (err) {
      const text = err instanceof ApiError && err.status === 409 ? "점검 시간과 겹치는 예약이 있습니다." : "점검 등록 실패";
      show("error", text);
    } finally {
      setBusy(false);
    }
  }

  const servers = data?.servers ?? [];

  return (
    <div>
      <TraceBar
        screen="서버 관리 (A2)"
        api="POST /servers · DELETE /servers/{id} · POST .../maintenances"
        feature="F14 · F15 · F16"
        uc="UC11 · UC12 · UC13"
        entity="Server · MaintenanceSchedule"
      />
      <PageHead title="서버 관리" desc="서버를 등록·삭제하고 점검 일정을 잡습니다." />

      {msg && (
        <div className="mb-3">
          <Notice tone={msg.tone}>{msg.text}</Notice>
        </div>
      )}

      <form onSubmit={createServer} className="mb-5 rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-4">
        <h2 className="mb-3 text-[13px] font-semibold">서버 등록</h2>
        <div className="grid grid-cols-2 gap-x-4 md:grid-cols-3">
          <Field label="이름" htmlFor="s-name"><Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
          <Field label="IP" htmlFor="s-ip"><Input id="s-ip" value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} placeholder="10.0.0.x" required /></Field>
          <Field label="그룹" htmlFor="s-group"><Input id="s-group" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="Lab-A GPU" /></Field>
          <Field label="CPU 코어" htmlFor="s-cpu"><Input id="s-cpu" type="number" min={1} value={form.cpuCores} onChange={(e) => setForm({ ...form, cpuCores: e.target.value })} required /></Field>
          <Field label="RAM(GB)" htmlFor="s-ram"><Input id="s-ram" type="number" min={1} value={form.ramGb} onChange={(e) => setForm({ ...form, ramGb: e.target.value })} required /></Field>
          <Field label="GPU 모델" htmlFor="s-gpu"><Input id="s-gpu" value={form.gpuModel} onChange={(e) => setForm({ ...form, gpuModel: e.target.value })} placeholder="RTX4090" /></Field>
        </div>
        <Button type="submit" variant="pri" disabled={busy}>서버 등록</Button>
      </form>

      {loading && <Spinner />}
      {error && <Notice tone="error">서버 목록을 불러오지 못했습니다. {error.message}</Notice>}

      {!loading && !error && (
        <Table
          head={
            <>
              <Th>서버</Th>
              <Th>상태</Th>
              <Th>사양</Th>
              <Th />
            </>
          }
        >
          {servers.map((s) => (
            <tr key={s.id} className="hover:bg-[#fbfcfe]">
              <Td className="font-semibold">{s.name}</Td>
              <Td><StatusBadge status={s.status} /></Td>
              <Td className="font-mono text-[11.5px] text-[var(--text2)]">{s.spec.cpuCores}C · {s.spec.ramGb}GB{s.spec.gpuModel ? ` · ${s.spec.gpuModel}` : ""}</Td>
              <Td>
                <div className="flex gap-1.5">
                  <Button onClick={() => setMaintFor(maintFor === s.id ? null : s.id)}>점검</Button>
                  <Button variant="danger" disabled={busy} aria-label={`${s.name} 삭제`} onClick={() => removeServer(s.id, s.name)}>삭제</Button>
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {maintFor !== null && (
        <form onSubmit={scheduleMaint} className="mt-4 rounded-xl border border-[var(--bd)] bg-[var(--bg)] p-4">
          <h2 className="mb-3 text-[13px] font-semibold">점검 일정 — 서버 #{maintFor}</h2>
          <div className="grid grid-cols-2 gap-x-4">
            <Field label="시작" htmlFor="m-start"><Input id="m-start" type="datetime-local" value={maint.startAt} onChange={(e) => setMaint({ ...maint, startAt: e.target.value })} required /></Field>
            <Field label="종료" htmlFor="m-end"><Input id="m-end" type="datetime-local" value={maint.endAt} onChange={(e) => setMaint({ ...maint, endAt: e.target.value })} required /></Field>
          </div>
          <Field label="사유" htmlFor="m-reason"><Input id="m-reason" value={maint.reason} onChange={(e) => setMaint({ ...maint, reason: e.target.value })} placeholder="디스크 교체" /></Field>
          <Button type="submit" variant="pri" disabled={busy}>점검 등록</Button>
        </form>
      )}
    </div>
  );
}
