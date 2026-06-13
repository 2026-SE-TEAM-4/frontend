import { useTheme } from "./ThemeContext";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "라이트 테마로 전환" : "다크 테마로 전환"}
      title={isDark ? "라이트 테마" : "다크 테마"}
      className="grid h-[30px] w-[30px] place-items-center rounded-[7px] border border-[var(--bd)] bg-[var(--bg)] text-[15px] text-[var(--text2)] hover:bg-[var(--soft)]"
    >
      {isDark ? "☀" : "☽"}
    </button>
  );
}
