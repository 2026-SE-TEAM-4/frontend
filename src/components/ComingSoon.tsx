export function ComingSoon({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-[20px] font-bold">{title}</h1>
      <p className="mt-2 text-[13px] text-[var(--mut)]">
        이 화면은 다음 단계(역할 전용 화면 계획)에서 구현됩니다.
      </p>
    </div>
  );
}
