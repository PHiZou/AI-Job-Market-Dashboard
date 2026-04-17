"use client";
import { useMemo, useState } from "react";
import { Pin, PinOff, Search } from "lucide-react";
import type { SkillsData } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { usePrefs } from "@/lib/usePrefs";

interface SkillsLeaderboardProps {
  skills: SkillsData;
}

type SortKey = "count" | "growth";

export function SkillsLeaderboard({ skills }: SkillsLeaderboardProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("count");
  const { prefs, togglePinnedSkill, hydrated } = usePrefs();

  const rows = useMemo(() => buildRows(skills), [skills]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((r) => r.skill.toLowerCase().includes(q));
    const pinned = new Set(hydrated ? prefs.pinnedSkills : []);
    list.sort((a, b) => {
      const aPinned = pinned.has(a.skill);
      const bPinned = pinned.has(b.skill);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      if (sort === "count") return b.count - a.count;
      return b.growth - a.growth;
    });
    return list;
  }, [rows, query, sort, prefs.pinnedSkills, hydrated]);

  return (
    <Card>
      <CardHeader
        title="Top skills in demand"
        description="Aggregate mentions with recent 14-day trend"
        action={
          <Tabs
            value={sort}
            onChange={(v) => setSort(v)}
            items={[
              { value: "count", label: "By count" },
              { value: "growth", label: "By growth" },
            ]}
          />
        }
      />
      <CardBody className="space-y-3">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills..."
            className="pl-8"
            aria-label="Search skills"
          />
        </label>

        {filtered.length === 0 ? (
          <EmptyState title="No skills match" description="Try a different search term." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.slice(0, 25).map((row) => {
              const pinned = hydrated && prefs.pinnedSkills.includes(row.skill);
              return (
                <li
                  key={row.skill}
                  className="flex items-center gap-3 py-2.5 text-sm"
                >
                  <button
                    type="button"
                    onClick={() => togglePinnedSkill(row.skill)}
                    aria-label={pinned ? `Unpin ${row.skill}` : `Pin ${row.skill}`}
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  >
                    {pinned ? (
                      <Pin className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    ) : (
                      <PinOff className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>
                  <span className="grow truncate font-medium text-slate-900 dark:text-slate-100">
                    {row.skill}
                  </span>
                  <Sparkline values={row.trend} />
                  <Badge tone={row.growth > 0 ? "green" : row.growth < 0 ? "red" : "neutral"}>
                    {row.growth >= 0 ? "+" : ""}
                    {row.growth.toFixed(0)}%
                  </Badge>
                  <span className="w-10 shrink-0 text-right tabular-nums text-slate-500 dark:text-slate-400">
                    {row.count}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

interface Row {
  skill: string;
  count: number;
  growth: number;
  trend: number[];
}

function buildRows(skills: SkillsData): Row[] {
  const byDate = skills.by_date;
  const dates = byDate ? Object.keys(byDate).sort() : [];
  return Object.entries(skills.overall).map(([skill, count]) => {
    const trend = dates.slice(-14).map((d) => byDate?.[d]?.[skill] ?? 0);
    const growth = computeGrowth(dates, byDate, skill);
    return { skill, count, growth, trend };
  });
}

function computeGrowth(
  dates: string[],
  byDate: SkillsData["by_date"],
  skill: string,
): number {
  if (!byDate || dates.length < 4) return 0;
  const half = Math.max(1, Math.floor(dates.length / 2));
  const recent = dates.slice(-half).reduce((acc, d) => acc + (byDate[d]?.[skill] ?? 0), 0);
  const prior = dates.slice(-half * 2, -half).reduce((acc, d) => acc + (byDate[d]?.[skill] ?? 0), 0);
  if (prior === 0) return recent > 0 ? 100 : 0;
  return ((recent - prior) / prior) * 100;
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.length || values.every((v) => v === 0)) {
    return <div className="h-4 w-16 rounded-sm bg-slate-100 dark:bg-slate-800" aria-hidden="true" />;
  }
  const max = Math.max(...values, 1);
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1 || 1)) * 60;
      const y = 16 - (v / max) * 14;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg
      width={64}
      height={18}
      viewBox="0 0 64 18"
      className="text-indigo-500"
      aria-hidden="true"
    >
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}
