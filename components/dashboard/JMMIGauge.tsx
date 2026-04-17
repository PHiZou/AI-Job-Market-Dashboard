import type { JMMI } from "@/lib/types";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatPercent, formatRelative } from "@/lib/formatters";

interface JMMIGaugeProps {
  jmmi: JMMI;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#10b981"; // emerald
  if (score >= 55) return "#6366f1"; // indigo
  if (score >= 35) return "#f59e0b"; // amber
  return "#ef4444"; // rose
}

export function JMMIGauge({ jmmi }: JMMIGaugeProps) {
  const score = Math.max(0, Math.min(100, jmmi.overall_score));
  const color = scoreColor(score);

  // semicircle arc, 180deg from 180 -> 0
  const radius = 90;
  const circumference = Math.PI * radius; // half circle
  const dash = (score / 100) * circumference;

  return (
    <Card>
      <CardHeader
        title="Job Market Momentum Index"
        description={`Updated ${formatRelative(jmmi.calculated_at)}`}
        action={<Badge tone="indigo">{jmmi.interpretation.label}</Badge>}
      />
      <CardBody className="grid gap-6 md:grid-cols-[260px_1fr]">
        <div className="flex flex-col items-center">
          <svg
            viewBox="0 0 220 130"
            className="w-full max-w-[260px]"
            aria-label={`JMMI score ${score} out of 100`}
            role="img"
          >
            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke="currentColor"
              strokeWidth="14"
              strokeLinecap="round"
              className="text-slate-200 dark:text-slate-800"
            />
            <path
              d="M 20 110 A 90 90 0 0 1 200 110"
              fill="none"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
            />
            <text
              x="110"
              y="95"
              textAnchor="middle"
              className="fill-slate-900 text-[34px] font-bold dark:fill-slate-100"
            >
              {score.toFixed(0)}
            </text>
            <text
              x="110"
              y="118"
              textAnchor="middle"
              className="fill-slate-500 text-[11px] dark:fill-slate-400"
            >
              out of 100
            </text>
          </svg>
          <p className="mt-1 text-center text-sm text-slate-600 dark:text-slate-300">
            {jmmi.interpretation.description}
          </p>
        </div>

        <div className="grid gap-3">
          <Component
            label="Posting velocity"
            score={jmmi.components.posting_velocity.score}
            detail={jmmi.components.posting_velocity.description}
            meta={formatPercent(jmmi.components.posting_velocity.change_pct)}
          />
          <Component
            label="Skill velocity"
            score={jmmi.components.skill_velocity.score}
            detail={jmmi.components.skill_velocity.description}
            meta={`${jmmi.components.skill_velocity.trending_skills_count} trending`}
          />
          <Component
            label="Forecast accuracy"
            score={jmmi.components.forecast_accuracy.score}
            detail={jmmi.components.forecast_accuracy.description}
            meta={`MAPE ${jmmi.components.forecast_accuracy.mape.toFixed(0)}%`}
          />
          <Component
            label="Market activity"
            score={jmmi.components.market_activity.score}
            detail={jmmi.components.market_activity.description}
            meta={`${jmmi.components.market_activity.total_alerts} alerts`}
          />
          <Component
            label="Company diversity"
            score={jmmi.components.company_diversity.score}
            detail={jmmi.components.company_diversity.description}
            meta={`${jmmi.components.company_diversity.unique_companies} companies`}
          />

          <div className="mt-2 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-900 dark:bg-indigo-500/10 dark:text-indigo-200">
            <span className="font-semibold">Recommendation: </span>
            {jmmi.recommendation}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function Component({
  label,
  score,
  detail,
  meta,
}: {
  label: string;
  score: number;
  detail: string;
  meta: string;
}) {
  const color = scoreColor(score);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">
          {score.toFixed(0)} · {meta}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full transition-[width]"
          style={{ width: `${Math.max(0, Math.min(100, score))}%`, backgroundColor: color }}
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{detail}</p>
    </div>
  );
}
