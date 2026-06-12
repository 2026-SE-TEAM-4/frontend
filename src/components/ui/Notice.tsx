import type { ReactNode } from "react";

type Tone = "error" | "info" | "warn" | "success";

const styles: Record<Tone, string> = {
  error: "bg-[var(--dngs)] text-[#842029] border-[#f1aeb5]",
  info: "bg-[var(--accs)] text-[var(--acct)] border-[#9ec3ff]",
  warn: "bg-[var(--rsvs)] text-[#664d03] border-[#ffe69c]",
  success: "bg-[var(--oks)] text-[#0f5132] border-[#a3cfbb]",
};

export function Notice({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex gap-2 rounded-lg border px-3 py-2 text-[12.5px] ${styles[tone]}`}
    >
      {children}
    </div>
  );
}
