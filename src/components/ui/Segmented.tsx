interface Opt<T extends string> {
  value: T;
  label: string;
  sub?: string;
}

interface Props<T extends string> {
  options: Opt<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: Props<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex overflow-hidden rounded-[9px] border border-[var(--bd)]"
    >
      {options.map((opt) => {
        const on = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(opt.value)}
            className={`flex-1 border-r border-[var(--bd2)] px-2 py-2.5 text-center text-[12.5px] font-semibold last:border-r-0 ${
              on
                ? "bg-[var(--accs)] text-[var(--acct)] shadow-[inset_0_-2px_0_var(--acc)]"
                : "text-[var(--mut)] hover:bg-[var(--soft)]"
            }`}
          >
            {opt.label}
            {opt.sub && <span className="block font-mono text-[10px] opacity-70">{opt.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}
