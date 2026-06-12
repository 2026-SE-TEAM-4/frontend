export function Spinner({ label = "불러오는 중…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-[13px] text-[var(--mut)]">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--bd)] border-t-[var(--acc)]" />
      {label}
    </div>
  );
}
