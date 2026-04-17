"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Company } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatNumber, formatSalaryRange } from "@/lib/formatters";

interface CompanyLeaderboardProps {
  companies: Company[];
}

type SortKey = "count" | "salary" | "name";

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-teal-500",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function CompanyLeaderboard({ companies }: CompanyLeaderboardProps) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("count");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = companies.filter((c) => c.company_name.toLowerCase().includes(q));
    list.sort((a, b) => {
      if (sort === "count") return b.job_count - a.job_count;
      if (sort === "salary")
        return (b.avg_salary_max || 0) - (a.avg_salary_max || 0);
      return a.company_name.localeCompare(b.company_name);
    });
    return list;
  }, [companies, query, sort]);

  return (
    <Card>
      <CardHeader
        title="Top hiring companies"
        description="Active employers ranked by posting volume"
        action={
          <Tabs
            value={sort}
            onChange={(v) => setSort(v)}
            items={[
              { value: "count", label: "Jobs" },
              { value: "salary", label: "Salary" },
              { value: "name", label: "A-Z" },
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
            placeholder="Search companies..."
            className="pl-8"
            aria-label="Search companies"
          />
        </label>

        {filtered.length === 0 ? (
          <EmptyState title="No companies match" description="Try a different search term." />
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.slice(0, 25).map((c) => (
              <li key={c.company_name} className="flex items-center gap-3 py-2.5 text-sm">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColor(c.company_name)}`}
                  aria-hidden="true"
                >
                  {initials(c.company_name)}
                </div>
                <div className="min-w-0 grow">
                  <div className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {c.company_name}
                  </div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {c.primary_category} · {c.primary_location || "Multiple locations"}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {formatSalaryRange(c.avg_salary_min, c.avg_salary_max)}
                  </div>
                  <div className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {formatNumber(c.job_count)} jobs
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
