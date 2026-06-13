import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_TICK, CHART, TOOLTIP_STYLE } from "./chartTheme";

interface HistoryPoint {
  ts: string;
  value: number;
}

interface ForecastPoint {
  ts: string;
  yhat: number;
  lower: number;
  upper: number;
}

interface ForecastCorridorProps {
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  threshold?: number;
  saturationLabel?: string;
  height?: number;
}

// 관측 구간과 예측 구간을 하나의 시간축에 합친다. 과거는 value, 미래는 yhat·band.
type Row = { ts: string; actual?: number; yhat?: number; lower?: number; upper?: number };

function buildRows(history: HistoryPoint[], forecast: ForecastPoint[]): Row[] {
  const past: Row[] = history.map((h) => ({ ts: h.ts, actual: h.value }));
  const future: Row[] = forecast.map((f) => ({
    ts: f.ts,
    yhat: f.yhat,
    lower: f.lower,
    upper: f.upper,
  }));
  // now 분기선을 그릴 수 있도록 마지막 관측점을 예측 시작에도 이어 붙인다.
  if (past.length > 0 && future.length > 0) {
    future[0] = { ...future[0], actual: history[history.length - 1].value };
  }
  return [...past, ...future];
}

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function ForecastTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2.5 py-1.5" style={TOOLTIP_STYLE}>
      <div className="mb-1 text-[11px] text-[var(--g-mut)]">{label}</div>
      {payload
        .filter((p) => p.value !== undefined && p.value !== null)
        .map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 font-mono"
            style={{ fontVariantNumeric: "tabular-nums" }}
          >
            <span style={{ color: p.color }}>{p.name}</span>
            <span className="text-[var(--g-tx)]">
              {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            </span>
          </div>
        ))}
    </div>
  );
}

export function ForecastCorridor({
  history,
  forecast,
  threshold,
  saturationLabel,
  height = 260,
}: ForecastCorridorProps) {
  const rows = buildRows(history, forecast);
  const nowTs = forecast[0]?.ts;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={rows} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="ts" tick={AXIS_TICK} stroke={CHART.axis} minTickGap={28} />
        <YAxis tick={AXIS_TICK} stroke={CHART.axis} width={36} />
        <Tooltip content={<ForecastTooltip />} />

        <Area
          dataKey="upper"
          stroke="none"
          fill={CHART.forecast}
          fillOpacity={0.14}
          isAnimationActive={false}
          name="신뢰 상한"
          connectNulls
        />
        <Area
          dataKey="lower"
          stroke="none"
          fill={CHART.forecast}
          fillOpacity={0.14}
          isAnimationActive={false}
          name="신뢰 하한"
          connectNulls
        />

        <Line
          dataKey="actual"
          stroke={CHART.line}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          name="관측"
          connectNulls
        />
        <Line
          dataKey="yhat"
          stroke={CHART.forecast}
          strokeWidth={2}
          strokeDasharray="5 4"
          dot={false}
          isAnimationActive={false}
          name="예측"
          connectNulls
        />

        {nowTs && (
          <ReferenceLine
            x={nowTs}
            stroke={CHART.now}
            strokeDasharray="3 3"
            label={{ value: "now", fill: CHART.now, fontSize: 11, position: "top" }}
          />
        )}
        {threshold !== undefined && (
          <ReferenceLine
            y={threshold}
            stroke={CHART.threshold}
            strokeDasharray="5 4"
            label={{
              value: saturationLabel ?? `임계 ${threshold}`,
              fill: CHART.threshold,
              fontSize: 11,
              position: "right",
            }}
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
