"use client";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, TrendingDown, TrendingUp } from "lucide-react";
import type { Alert, AlertSeverity, AlertType } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatPercent, formatRelative } from "@/lib/formatters";
import { usePrefs } from "@/lib/usePrefs";

interface AlertsPanelProps {
  alerts: Alert[];
}

type TabValue = "all" | AlertType;

const SEVERITY_TONE: Record<AlertSeverity, "red" | "amber" | "sky"> = {
  high: "red",
  medium: "amber",
  low: "sky",
};

function alertIcon(type: AlertType) {
  if (type === "spike") return <TrendingUp className="h-4 w-4" aria-hidden="true" />;
  if (type === "drop") return <TrendingDown className="h-4 w-4" aria-hidden="true" />;
  return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const { prefs, update } = usePrefs();
  const [expanded, setExpanded] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { all: alerts.length, spike: 0, drop: 0, skill_trend: 0 };
    alerts.forEach((a) => {
      c[a.type] += 1;
    });
    return c;
  }, [alerts]);

  const tab: TabValue = prefs.alertsTab;
  const filtered = tab === "all" ? alerts : alerts.filter((a) => a.type === tab);

  return (
    <Card>
      <CardHeader
        title="Market alerts"
        description="Spikes, drops, and trending skills detected from recent postings"
        action={
          <Tabs
            value={tab}
            onChange={(v) => update({ alertsTab: v })}
            items={[
              { value: "all", label: "All", count: counts.all },
              { value: "spike", label: "Spikes", count: counts.spike },
              { value: "drop", label: "Drops", count: counts.drop },
              { value: "skill_trend", label: "Skills", count: counts.skill_trend },
            ]}
          />
        }
      />
      <CardBody>
        {filtered.length === 0 ? (
          <EmptyState title="No alerts" description="Nothing unusual detected for this filter." />
        ) : (
          <ul className="space-y-2">
            {filtered.map((a) => {
              const open = expanded === a.id;
              return (
                <li
                  key={a.id}
                  className="rounded-lg border border-slate-200/70 bg-white/50 dark:border-slate-800 dark:bg-slate-900/40"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : a.id)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 p-3 text-left"
                  >
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                      aria-hidden="true"
                    >
                      {alertIcon(a.type)}
                    </span>
                    <div className="min-w-0 grow">
                      <div className="flex items-center gap-2">
                        <Badge tone={SEVERITY_TONE[a.severity]}>{a.severity}</Badge>
                        <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                          {a.category}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                        {a.message} · {formatRelative(a.generated_at)}
                      </div>
                    </div>
                    {open ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    )}
                  </button>
                  {open ? (
                    <div className="grid gap-2 border-t border-slate-200/60 px-3 py-3 text-xs dark:border-slate-800/60 sm:grid-cols-4">
                      <Stat label="Date" value={formatDate(a.date, "long")} />
                      <Stat label="Actual" value={String(a.job_count)} />
                      <Stat
                        label="Expected"
                        value={a.expected_count ? a.expected_count.toFixed(1) : "—"}
                      />
                      <Stat
                        label={a.type === "skill_trend" ? "Growth" : "Change"}
                        value={
                          typeof a.pct_change === "number"
                            ? formatPercent(a.pct_change)
                            : typeof a.z_score === "number"
                              ? `z = ${a.z_score.toFixed(2)}`
                              : "—"
                        }
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </div>
      <div className="font-medium text-slate-900 dark:text-slate-100">{value}</div>
    </div>
  );
}
