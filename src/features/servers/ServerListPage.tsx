import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Table, Td, Th } from "@/components/ui/Table";
import { healthClass } from "@/lib/format";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import type { ServerStatus } from "@/types/api";
import { useServers, type StatusFilter } from "./useServers";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "AVAILABLE", label: "가용" },
  { key: "IN_USE", label: "사용 중" },
  { key: "RESERVED", label: "예약" },
  { key: "MAINTENANCE", label: "점검" },
];

function countBy(servers: { status: ServerStatus }[], status: ServerStatus) {
  return servers.filter((s) => s.status === status).length;
}

export function ServerListPage() {
  const navigate = useNavigate();
  const { servers, loading, error, refetch, filters, setFilters } = useServers();

  return (
    <div>
      <TraceBar screen="서버 현황 (S2)" api="GET /servers" feature="F01" uc="UC01" entity="Server · Reservation" />
      <PageHead
        title="서버 현황"
        desc="상태·사양으로 거르고 정렬합니다. 가용 서버는 바로 예약할 수 있습니다."
        actions={
          <Button onClick={refetch} aria-label="새로고침">
            ↻ 새로고침
          </Button>
        }
      />

      <div className="mb-3.5 flex overflow-hidden rounded-[10px] border border-[var(--bd)] bg-[var(--bg)]">
        {(
          [
            ["가용", "AVAILABLE", "var(--ok)"],
            ["사용 중", "IN_USE", "var(--use)"],
            ["예약됨", "RESERVED", "var(--rsv)"],
            ["점검", "MAINTENANCE", "var(--mut)"],
          ] as const
        ).map(([label, status, color]) => (
          <div key={status} className="flex-1 border-r border-[var(--bd2)] px-4 py-2.5 last:border-r-0">
            <div className="font-mono text-[20px] font-bold" style={{ color }}>
              {countBy(servers, status)}
            </div>
            <div className="mt-1 text-[11.5px] text-[var(--mut)]">{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilters({ ...filters, status: f.key })}
            className={`cursor-pointer rounded-full border px-3 py-[5px] text-[12px] font-semibold ${
              filters.status === f.key
                ? "border-[var(--text)] bg-[var(--text)] text-white"
                : "border-[var(--bd)] bg-[var(--bg)] text-[var(--mut)] hover:bg-[var(--soft)]"
            }`}
          >
            {f.label}
          </button>
        ))}
        <select
          aria-label="정렬"
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="ml-auto rounded-[7px] border border-[var(--bd)] bg-white px-2.5 py-1.5 text-[12px]"
        >
          <option value="name">정렬: 이름</option>
          <option value="health_score">건강점수</option>
          <option value="status">상태</option>
        </select>
      </div>

      {loading && <Spinner />}
      {error && (
        <Notice tone="error">
          서버 목록을 불러오지 못했습니다. {error.message}{" "}
          <button className="underline" onClick={refetch}>
            다시 시도
          </button>
        </Notice>
      )}

      {!loading && !error && (
        <Table
          head={
            <>
              <Th>서버</Th>
              <Th>상태</Th>
              <Th>사양</Th>
              <Th>건강</Th>
              <Th>점유자</Th>
              <Th />
            </>
          }
        >
          {servers.length === 0 ? (
            <tr>
              <Td className="text-center text-[var(--mut)]">조건에 맞는 서버가 없습니다.</Td>
            </tr>
          ) : (
            servers.map((s) => (
              <tr key={s.id} className="hover:bg-[#fbfcfe]">
                <Td className="font-semibold">{s.name}</Td>
                <Td>
                  <StatusBadge status={s.status} />
                </Td>
                <Td className="font-mono text-[11.5px] text-[var(--text2)]">
                  {s.spec.cpuCores}C · {s.spec.ramGb}GB
                  {s.spec.gpuModel ? ` · ${s.spec.gpuModel}` : ""}
                </Td>
                <Td>
                  <span className={`font-mono text-[13px] font-bold ${healthClass(s.healthScore)}`}>
                    {s.healthScore ?? "—"}
                  </span>
                </Td>
                <Td className="text-[12px] text-[var(--text2)]">{s.occupant ?? "—"}</Td>
                <Td>
                  <Button
                    variant="outline"
                    disabled={s.status !== "AVAILABLE"}
                    aria-label={`${s.name} 예약 신청`}
                    onClick={() => navigate(`/servers/${s.id}/reserve`)}
                  >
                    예약
                  </Button>
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}
    </div>
  );
}
