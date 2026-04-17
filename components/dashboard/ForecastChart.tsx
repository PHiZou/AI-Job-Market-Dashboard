"use client";
import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Forecast } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/formatters";
import { usePrefs } from "@/lib/usePrefs";

interface ForecastChartProps {
  forecasts: Forecast[];
}

export function ForecastChart({ forecasts }: ForecastChartProps) {
  const { prefs, update, hydrated } = usePrefs();

  const categories = useMemo(() => {
    const set = new Set<string>();
    forecasts.forEach((f) => set.add(f.category));
    return ["All", ...[...set].sort()];
  }, [forecasts]);

  const selected = hydrated ? prefs.forecastCategory : "All";
  const filtered = useMemo(() => {
    const rows = selected === "All" ? aggregateAll(forecasts) : forecasts.filter((f) => f.category === selected);
    return rows
      .map((f) => ({
        date: f.date,
        forecast: f.forecast,
        band: [f.forecast_lower, f.forecast_upper],
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [forecasts, selected]);

  return (
    <Card>
      <CardHeader
        title="30-day hiring forecast"
        description="Projected postings with confidence interval"
        action={
          <select
            value={selected}
            onChange={(e) => update({ forecastCategory: e.target.value })}
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Forecast category"
          >
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        }
      />
      <CardBody>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <ComposedChart data={filtered} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.1} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => formatDate(d)}
                minTickGap={24}
                stroke="currentColor"
                fontSize={11}
              />
              <YAxis stroke="currentColor" fontSize={11} width={32} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.92)",
                  border: "none",
                  borderRadius: 8,
                  color: "white",
                  fontSize: 12,
                }}
                labelFormatter={(d) => formatDate(String(d), "long")}
                formatter={(value, name) => {
                  if (name === "band") {
                    const [lo, hi] = value as [number, number];
                    return [`${lo.toFixed(1)} – ${hi.toFixed(1)}`, "Confidence"];
                  }
                  return [Number(value).toFixed(1), "Forecast"];
                }}
              />
              <Area
                dataKey="band"
                stroke="none"
                fill="#6366f1"
                fillOpacity={0.15}
                isAnimationActive={false}
              />
              <Line
                dataKey="forecast"
                type="monotone"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

function aggregateAll(forecasts: Forecast[]): Forecast[] {
  const byDate = new Map<string, Forecast>();
  for (const f of forecasts) {
    const cur = byDate.get(f.date);
    if (!cur) {
      byDate.set(f.date, { ...f, category: "All" });
    } else {
      cur.forecast += f.forecast;
      cur.forecast_lower += f.forecast_lower;
      cur.forecast_upper += f.forecast_upper;
    }
  }
  return [...byDate.values()];
}
