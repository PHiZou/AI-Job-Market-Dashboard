"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/cn";

interface GlobalSearchProps {
  data: DashboardData;
}

type ResultKind = "skill" | "company" | "category" | "alert";

interface Result {
  kind: ResultKind;
  label: string;
  detail: string;
  href: string;
}

export function GlobalSearch({ data }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const index = useMemo(() => buildIndex(data), [data]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter((r) => r.label.toLowerCase().includes(q) || r.detail.toLowerCase().includes(q))
      .slice(0, 12);
  }, [query, index]);

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search skills, companies, alerts..."
          aria-label="Global search"
          className="h-9 w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <kbd
          className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 sm:inline dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          aria-hidden="true"
        >
          ⌘K
        </kbd>
      </label>

      {open && results.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-80 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <ul>
            {results.map((r, i) => (
              <li key={`${r.kind}-${r.label}-${i}`}>
                <a
                  href={r.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span
                    className={cn(
                      "inline-block shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                      r.kind === "skill" && "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
                      r.kind === "company" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
                      r.kind === "category" && "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
                      r.kind === "alert" && "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
                    )}
                  >
                    {r.kind}
                  </span>
                  <span className="truncate font-medium text-slate-900 dark:text-slate-100">
                    {r.label}
                  </span>
                  <span className="ml-auto truncate text-xs text-slate-500 dark:text-slate-400">
                    {r.detail}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function buildIndex(data: DashboardData): Result[] {
  const results: Result[] = [];
  Object.entries(data.skills.overall).forEach(([skill, count]) => {
    results.push({
      kind: "skill",
      label: skill,
      detail: `${count} mentions`,
      href: "#skills",
    });
  });
  data.companies.forEach((c) => {
    results.push({
      kind: "company",
      label: c.company_name,
      detail: `${c.job_count} jobs · ${c.primary_category}`,
      href: "#companies",
    });
  });
  const seenCat = new Set<string>();
  data.trends.forEach((t) => {
    if (seenCat.has(t.category)) return;
    seenCat.add(t.category);
    results.push({
      kind: "category",
      label: t.category,
      detail: "Category trend",
      href: "#trends",
    });
  });
  data.alerts.forEach((a) => {
    results.push({
      kind: "alert",
      label: a.category,
      detail: a.message,
      href: "#alerts",
    });
  });
  return results;
}
