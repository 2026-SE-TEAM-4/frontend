import { Panel } from "@/components/viz";
import { ApiError } from "@/lib/api";

import type { IncidentSummaryResp } from "./aiopsTypes";

interface Props {
  summary: IncidentSummaryResp | null;
  loading: boolean;
  error: ApiError | null;
}

// 보라색(--g-pur) 계열은 AI/LLM 산출물 전용 강조색이다. 다른 상태색과 섞지 않는다.
const ACCENT = "var(--g-pur)";
const ACCENT_BG = "var(--g-purbg)";

function ModelChip({ model }: { model: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold tnum"
      style={{ background: ACCENT_BG, color: ACCENT }}
    >
      ✦ {model}
    </span>
  );
}

function Footnote() {
  return (
    <p className="mt-3 border-t border-[var(--g-bd)] pt-2.5 text-[12px] text-[var(--g-mut)]">
      읽기 전용 분석 — 자동 조치 없음. 모든 주장에 근거 표기.
    </p>
  );
}

// 요약이 없을 때(키 미설정/미생성, 404)는 절대 임의로 채우지 않고 상태를 그대로 알린다.
function MissingState({ message }: { message: string }) {
  return (
    <div
      className="rounded-md border border-dashed border-[var(--g-bd)] px-4 py-6 text-center"
      style={{ background: "var(--g-pan2)" }}
    >
      <p className="text-[15px] font-semibold text-[var(--g-tx)]">요약 미생성</p>
      <p className="mt-1.5 text-[13px] text-[var(--g-mut)]">{message}</p>
    </div>
  );
}

export function RootCauseCard({ summary, loading, error }: Props) {
  const right = summary ? <ModelChip model={summary.model} /> : undefined;

  return (
    <Panel title="LLM 근본 원인" sub="이상탐지 근거 기반 자동 분석" right={right}>
      {loading && <p className="text-[14px] text-[var(--g-mut)]">분석을 불러오는 중…</p>}

      {!loading && error && error.status === 404 && (
        <MissingState message="이 인시던트는 아직 요약이 생성되지 않았습니다. (API 키 미설정이거나 요약 잡 미실행)" />
      )}

      {!loading && error && error.status !== 404 && (
        <MissingState message={`요약을 불러오지 못했습니다. ${error.message}`} />
      )}

      {!loading && !error && summary && (
        <div>
          <section>
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-[var(--g-mut)]">상황</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--g-tx)]">{summary.situation}</p>
          </section>

          <section className="mt-4">
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-[var(--g-mut)]">근본 원인</h3>
            <ul className="mt-2 space-y-2.5">
              {summary.rootCauses.map((rc, i) => (
                <li
                  key={i}
                  className="rounded-md border-l-2 px-3 py-2"
                  style={{ borderColor: ACCENT, background: "var(--g-pan2)" }}
                >
                  <p className="text-[14px] font-semibold text-[var(--g-tx)]">{rc.cause}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--g-mut)]">
                    <span className="font-semibold" style={{ color: ACCENT }}>
                      근거:{" "}
                    </span>
                    {rc.evidence}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-4">
            <h3 className="text-[13px] font-bold uppercase tracking-wide text-[var(--g-mut)]">권장 조치</h3>
            <ul className="mt-2 space-y-2.5">
              {summary.recommendations.map((rec, i) => (
                <li key={i} className="rounded-md border border-[var(--g-bd)] px-3 py-2">
                  <p className="text-[14px] font-semibold text-[var(--g-tx)]">
                    <span className="mr-1.5 font-mono text-[13px]" style={{ color: ACCENT }}>
                      {i + 1}.
                    </span>
                    {rec.action}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--g-mut)]">{rec.rationale}</p>
                </li>
              ))}
            </ul>
          </section>

          <Footnote />
        </div>
      )}
    </Panel>
  );
}
