import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Notice";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/context/AuthContext";
import { healthClass } from "@/lib/format";
import { PageHead } from "@/layout/PageHead";
import { TraceBar } from "@/layout/TraceBar";
import { useApi } from "@/hooks/useApi";
import type { HealthTrend, ServerDetailResponse } from "@/types/api";

const TREND_LABEL: Record<string, string> = { IMPROVING: "개선 중", STABLE: "안정", DEGRADING: "열화 중" };

export function ServerDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const canSeeTrend = user?.role === "MGR" || user?.role === "ADM";
  const detail = useApi<ServerDetailResponse>(`/servers/${id}`);
  const trend = useApi<HealthTrend>(canSeeTrend ? `/servers/${id}/health-trend` : null);
  const server = detail.data;

  return (
    <div>
      <TraceBar screen="서버 상세 (S3)" api="GET /servers/{id} · /health-trend" feature="F02 · UC23" uc="UC01 · UC23" entity="Server · ServerHealthHistory" />

      {detail.loading && <Spinner />}
      {detail.error && <Notice tone="error">서버를 불러오지 못했습니다. {detail.error.message}</Notice>}

      {server && (
        <>
          <PageHead
            title={server.name}
            desc={`${server.spec.cpuCores}C · ${server.spec.ramGb}GB${server.spec.gpuModel ? ` · ${server.spec.gpuModel}` : ""}`}
            actions={
              server.status === "AVAILABLE" ? (
                <Link to={`/servers/${server.id}/reserve`}>
                  <Button variant="pri">예약</Button>
                </Link>
              ) : undefined
            }
          />

          <div className="flex flex-wrap gap-4">
            <div className="rounded-[10px] border border-[var(--bd)] bg-[var(--bg)] px-4 py-3">
              <div className="mb-1 text-[11.5px] text-[var(--mut)]">상태</div>
              <StatusBadge status={server.status} />
            </div>
            <div className="rounded-[10px] border border-[var(--bd)] bg-[var(--bg)] px-4 py-3">
              <div className="mb-1 text-[11.5px] text-[var(--mut)]">건강 점수</div>
              <span className={`font-mono text-[20px] font-bold ${healthClass(server.healthScore)}`}>
                {server.healthScore ?? "—"}
              </span>
            </div>
          </div>

          {canSeeTrend && trend.data && (
            <section className="mt-4 rounded-[10px] border border-[var(--bd)] bg-[var(--bg)] p-4">
              <h2 className="mb-3 text-[13px] font-semibold">건강·위험 추세 (UC23)</h2>
              <div className="flex flex-wrap gap-6">
                <div>
                  <div className="text-[11.5px] text-[var(--mut)]">추세</div>
                  <div className="font-semibold">{TREND_LABEL[trend.data.trend] ?? trend.data.trend}</div>
                </div>
                <div>
                  <div className="text-[11.5px] text-[var(--mut)]">위험 점수</div>
                  <div className="font-mono font-bold">{trend.data.riskScore ?? "—"}</div>
                </div>
              </div>
              {trend.data.history.length > 0 && (
                <div className="mt-3 flex h-16 items-end gap-1">
                  {trend.data.history.map((p, i) => (
                    <span
                      key={i}
                      title={`${p.healthScore}`}
                      className="flex-1 rounded-t bg-[var(--accs)]"
                      style={{ height: `${Math.max(4, p.healthScore)}%` }}
                    />
                  ))}
                </div>
              )}
              {trend.data.drivers.length > 0 && (
                <ul className="mt-3 list-disc pl-5 text-[12px] text-[var(--text2)]">
                  {trend.data.drivers.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
