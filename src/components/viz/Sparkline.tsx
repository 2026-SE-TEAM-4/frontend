interface SparklineProps {
  points: number[];
  tone?: "grn" | "red" | "yel" | "blu" | "mut";
  width?: number;
  height?: number;
}

const TONE_COLOR: Record<NonNullable<SparklineProps["tone"]>, string> = {
  grn: "var(--g-grn)",
  red: "var(--g-red)",
  yel: "var(--g-yel)",
  blu: "var(--g-blu)",
  mut: "var(--g-mut)",
};

// 행 안에 들어가는 미니 추세선. 축·라벨 없이 형태만 보여준다.
export function Sparkline({ points, tone = "blu", width = 80, height = 22 }: SparklineProps) {
  if (points.length < 2) return <span className="text-[11px] text-[var(--g-mut)]">—</span>;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  const stepX = width / (points.length - 1);

  const d = points
    .map((p, i) => {
      const x = i * stepX;
      const y = height - ((p - min) / span) * height;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={TONE_COLOR[tone]} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}
