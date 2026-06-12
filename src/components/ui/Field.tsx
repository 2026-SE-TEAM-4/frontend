import type { ReactNode } from "react";

interface Props {
  label: string;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}

export function Field({ label, htmlFor, children, className = "" }: Props) {
  return (
    <div className={`mb-3.5 ${className}`}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block font-mono text-[11px] font-semibold uppercase tracking-wide text-[var(--mut)]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
