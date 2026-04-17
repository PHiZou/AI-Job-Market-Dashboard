"use client";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TrendPoint } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { formatDate } from "@/lib/formatters";
import { usePrefs } from "@/lib/usePrefs";

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#0ea5e9",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
];

interface HiringVolumeChartProps {
  trends: TrendPoint[];
}

export function HiringVolumeChart({ trends }: HiringVolumeChartProps) {
  const { prefs, update } = usePrefs();
  const metric = prefs.rollingWindow === "7d" ? "rolling_7d" : "rolling_30d";

  const { data, categories } = useMemo(() => buildSeries(trends, metric), [trends, metric]);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const toggle = (cat: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <Card>
      <CardHeader
        title="Hiring volume by category"
        description={`Daily postings with ${prefs.rollingWindow === "7d" ? "7-day" : "30-day"} rolling average`}
        action={
          <Tabs
            value={prefs.rollingWindow}
            onChange={(v) => update({ rollingWindow: v })}
            items={[
              { value: "7d", label: "7d" },
              { value: "30d", label: "30d" },
            ]}
          />
        }
      />
      <CardBody>
        <div className="h-80 w-full">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
              />
              <Legend
                wrapperStyle={{ fontSize: 12 }}
                onClick={(e) => toggle(String(e.value))}
              />
              {categories.map((cat, i) => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  hide={hidden.has(cat)}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardBody>
    </Card>
  );
}

function buildSeries(
  trends: TrendPoint[],
  metric: "rolling_7d" | "rolling_30d",
): { data: Array<Record<string, number | string>>; categories: string[] } {
  const byDate = new Map<string, Record<string, number | string>>();
  const cats = new Set<string>();
  for (const row of trends) {
    cats.add(row.category);
    const slot = byDate.get(row.date) ?? { date: row.date };
    slot[row.category] = row[metric] ?? row.job_count;
    byDate.set(row.date, slot);
  }
  const data = [...byDate.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const categories = [...cats].sort();
  return { data, categories };
}
