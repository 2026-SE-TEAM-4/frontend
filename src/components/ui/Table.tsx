import type { ReactNode } from "react";

export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[10px] border border-[var(--bd)] bg-[var(--bg)]">
      <table className="w-full border-separate border-spacing-0 text-[13px]">
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Th({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <th
      className={`border-b border-[var(--bd)] bg-[var(--soft)] px-3.5 py-3 text-left font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--mut)] ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <td className={`border-b border-[var(--bd2)] px-3.5 py-3 align-middle ${className}`}>
      {children}
    </td>
  );
}
