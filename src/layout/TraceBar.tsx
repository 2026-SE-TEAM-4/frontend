interface Props {
  screen: string;
  api: string;
  feature: string;
  uc: string;
  entity: string;
}

function Cell({ k, v }: { k: string; v: string }) {
  return (
    <>
      <span className="rounded-[5px] border border-[var(--bd2)] bg-[var(--bg)] px-1.5 py-[3px] text-[9.5px] font-bold uppercase tracking-wide text-[var(--text2)]">
        {k}
      </span>
      <span className="font-semibold text-[var(--acct)]">{v}</span>
    </>
  );
}

export function TraceBar({ screen, api, feature, uc, entity }: Props) {
  return (
    <div className="mb-4 flex flex-wrap items-baseline gap-2.5 rounded-lg border border-dashed border-[var(--bd)] bg-[var(--soft)] px-3 py-2 font-mono text-[11px] text-[var(--mut)]">
      <Cell k="화면" v={screen} />
      <Cell k="API" v={api} />
      <Cell k="기능" v={feature} />
      <Cell k="UC" v={uc} />
      <Cell k="엔티티" v={entity} />
    </div>
  );
}
