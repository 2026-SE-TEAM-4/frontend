import type { ReactNode } from "react";

interface Props {
  title: string;
  desc?: string;
  actions?: ReactNode;
}

export function PageHead({ title, desc, actions }: Props) {
  return (
    <div className="mb-4 flex items-start gap-4">
      <div className="min-w-0">
        <h1 className="text-[20px] font-bold">{title}</h1>
        {desc && <p className="mt-1 text-[12.5px] text-[var(--mut)]">{desc}</p>}
      </div>
      {actions && <div className="ml-auto flex gap-2">{actions}</div>}
    </div>
  );
}
