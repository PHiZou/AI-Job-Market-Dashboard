import type { DashboardData } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { formatNumber, formatRelative } from "@/lib/formatters";

interface DataQualityIndicatorProps {
  data: DashboardData;
}

export function DataQualityIndicator({ data }: DataQualityIndicatorProps) {
  const totalJobs = data.trends.reduce((acc, t) => acc + t.job_count, 0);
  const uniqueCompanies = data.jmmi.components.company_diversity.unique_companies;
  const confidence =
    data.jmmi.components.forecast_accuracy.mape <= 20
      ? "High"
      : data.jmmi.components.forecast_accuracy.mape <= 50
        ? "Medium"
        : "Low";

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
      <span>
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {formatNumber(totalJobs)}
        </span>{" "}
        total job postings
      </span>
      <span aria-hidden="true">·</span>
      <span>
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {formatNumber(uniqueCompanies)}
        </span>{" "}
        companies
      </span>
      <span aria-hidden="true">·</span>
      <span>
        Last computed{" "}
        <span className="font-medium text-slate-700 dark:text-slate-300">
          {formatRelative(data.jmmi.calculated_at)}
        </span>
      </span>
      <span aria-hidden="true">·</span>
      <Badge
        tone={confidence === "High" ? "green" : confidence === "Medium" ? "amber" : "red"}
      >
        {confidence} confidence
      </Badge>
    </div>
  );
}
