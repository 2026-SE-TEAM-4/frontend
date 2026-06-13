import { useEffect, useState } from "react";

interface Props {
  lastUpdatedAt: Date | null;
  loading: boolean;
  onRefresh: () => void;
}

function useRelativeTime(date: Date | null): string {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!date) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [date]);

  if (!date) return "—";
  const diff = Math.floor((now - date.getTime()) / 1000);
  if (diff < 60) return `${diff}초 전`;
  return `${Math.floor(diff / 60)}분 전`;
}

export function RefreshBar({ lastUpdatedAt, loading, onRefresh }: Props) {
  const rel = useRelativeTime(lastUpdatedAt);

  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[11.5px] text-[var(--g-mut)] tabular-nums">
        {lastUpdatedAt ? `${rel} 업데이트` : "—"}
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        title="새로고침"
        className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-[var(--g-bd)] bg-[var(--g-pan2)] text-[var(--g-mut)] transition-colors hover:border-[var(--g-tx)] hover:text-[var(--g-tx)] disabled:opacity-40"
      >
        <RefreshIcon spinning={loading} />
      </button>
    </div>
  );
}

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={spinning ? "animate-spin" : undefined}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
