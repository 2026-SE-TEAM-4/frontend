import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  sub?: string;
  right?: ReactNode;
  children: ReactNode;
}

export function Panel({ title, sub, right, children }: PanelProps) {
  return (
    <section className="rounded-lg border border-[var(--g-bd)] bg-[var(--g-pan)]">
      <header className="flex items-center justify-between gap-3 border-b border-[var(--g-bd)] px-4 py-2.5">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-[var(--g-tx)]">{title}</h2>
          {sub && <p className="mt-0.5 text-[12px] text-[var(--g-mut)]">{sub}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
