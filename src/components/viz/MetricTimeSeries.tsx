import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AXIS_TICK, CHART, TOOLTIP_STYLE } from "./chartTheme";

export interface MetricPoint {
  ts: string;
  value: number;
  lower?: number;
  upper?: number;
}

interface MetricTimeSeriesProps {
  data: MetricPoint[];
  threshold?: number;
  anomalies?: { ts: string; value: number }[];
  unit?: string;
  height?: number;
}

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
}

function TabularTooltip({
  active,
  label,
  payload,
  unit,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipEntry[];
  unit: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-2.5 py-1.5" style={TOOLTIP_STYLE}>
      <div className="mb-1 text-[11px] text-[var(--g-mut)]">{label}</div>
      {payload.map((p, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-3 font-mono"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-[var(--g-tx)]">
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
            {unit}
          </span>
        </div>
      ))}
    </div>
  );
}

// 시계열 라인 + 예측 범위(밴드) + 임계 점선 + 이상 마커.
// 밴드는 lower~upper 사이를 옅게 칠해 "예상 범위"를 보여준다.
export function MetricTimeSeries({
  data,
  threshold,
  anomalies = [],
  unit = "%",
  height = 240,
}: MetricTimeSeriesProps) {
  const hasBand = data.some((d) => d.lower !== undefined && d.upper !== undefined);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={CHART.grid} strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="ts" tick={AXIS_TICK} stroke={CHART.axis} minTickGap={28} />
        <YAxis tick={AXIS_TICK} stroke={CHART.axis} width={36} />
        <Tooltip content={<TabularTooltip unit={unit} />} />

        {hasBand && (
          <Area
            dataKey="upper"
            stroke="none"
            fill={CHART.band}
            fillOpacity={0.12}
            isAnimationActive={false}
            name="예상 상한"
          />
        )}
        {hasBand && (
          <Area
            dataKey="lower"
            stroke="none"
            fill={CHART.band}
            fillOpacity={0.12}
            isAnimationActive={false}
            name="예상 하한"
          />
        )}

        <Line
          dataKey="value"
          stroke={CHART.line}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
          name="실측"
        />

        {threshold !== undefined && (
          <ReferenceLine
            y={threshold}
            stroke={CHART.threshold}
            strokeDasharray="5 4"
            label={{ value: `임계 ${threshold}${unit}`, fill: CHART.threshold, fontSize: 11, position: "right" }}
          />
        )}

        {anomalies.length > 0 && (
          <Scatter
            data={anomalies}
            dataKey="value"
            fill={CHART.anomaly}
            isAnimationActive={false}
            name="이상"
          />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
