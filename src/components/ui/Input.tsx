import { forwardRef, type InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-lg border border-[var(--bd)] bg-white px-3 py-2.5 text-[13.5px] text-[var(--text)] outline-none focus:border-[var(--acc)] focus:ring-2 focus:ring-[var(--accs)] ${className}`}
        {...rest}
      />
    );
  },
);
