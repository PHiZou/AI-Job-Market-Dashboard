"use client";
import Link from "next/link";
import { BriefcaseBusiness, Flame, Target } from "lucide-react";
import type { DashboardData } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { formatPercent } from "@/lib/formatters";

interface InsightsSummaryProps {
  data: DashboardData;
}

export function InsightsSummary({ data }: InsightsSummaryProps) {
  const topSkill = Object.entries(data.skills.overall).sort((a, b) => b[1] - a[1])[0];
  const topTrendingSkill = data.jmmi.components.skill_velocity.trending_skills[0];
  const topCompany = [...data.companies].sort((a, b) => b.job_count - a.job_count)[0];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <InsightCard
        href="#skills"
        icon={<Flame className="h-5 w-5" aria-hidden="true" />}
        tone="amber"
        label="Learn"
        headline={
          topTrendingSkill
            ? `${topTrendingSkill.skill}: ${formatPercent(topTrendingSkill.growth_pct)}`
            : topSkill
              ? `${topSkill[0]}: high demand`
              : "Explore trending skills"
        }
        detail="Fastest-growing skill across recent postings"
      />
      <InsightCard
        href="#forecast"
        icon={<Target className="h-5 w-5" aria-hidden="true" />}
        tone="indigo"
        label="Outlook"
        headline={data.jmmi.interpretation.label}
        detail={data.jmmi.interpretation.for_job_seekers}
      />
      <InsightCard
        href="#companies"
        icon={<BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />}
        tone="green"
        label="Apply"
        headline={topCompany ? `${topCompany.company_name}` : "Top hirers this week"}
        detail={
          topCompany
            ? `${topCompany.job_count} open roles · ${topCompany.primary_category}`
            : "See who is hiring right now"
        }
      />
    </div>
  );
}

function InsightCard({
  href,
  icon,
  label,
  headline,
  detail,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  headline: string;
  detail: string;
  tone: "amber" | "indigo" | "green";
}) {
  const toneClasses: Record<typeof tone, string> = {
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300",
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  };
  return (
    <Link href={href} className="group block">
      <Card className="transition-all group-hover:border-indigo-300 group-hover:shadow-md dark:group-hover:border-indigo-700">
        <CardBody className="flex items-start gap-3">
          <div className={`rounded-lg p-2 ${toneClasses[tone]}`}>{icon}</div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {label}
            </div>
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
              {headline}
            </div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{detail}</div>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
