import type { ButtonHTMLAttributes } from "react";

type Variant = "default" | "pri" | "danger" | "outline";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const base =
  "inline-flex items-center justify-center gap-1.5 rounded-[7px] px-3 py-2 text-[13px] font-semibold cursor-pointer transition disabled:cursor-not-allowed disabled:opacity-60";

const styles: Record<Variant, string> = {
  default: "border border-[var(--bd)] bg-[var(--bg)] text-[var(--text2)] hover:bg-[var(--soft)]",
  pri: "border border-[var(--acc)] bg-[var(--acc)] text-white hover:brightness-95",
  danger: "border border-[var(--dngs)] bg-[var(--bg)] text-[var(--dng)] hover:bg-[var(--dngs)]",
  outline: "border border-[var(--acc)] bg-[var(--bg)] text-[var(--acc)] hover:bg-[var(--accs)]",
};

export function Button({ variant = "default", className = "", ...rest }: Props) {
  return <button className={`${base} ${styles[variant]} ${className}`} {...rest} />;
}
