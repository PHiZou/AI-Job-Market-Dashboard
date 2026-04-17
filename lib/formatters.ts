export function formatNumber(n: number, maximumFractionDigits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, { maximumFractionDigits });
}

export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function formatPercent(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}

export function formatCurrency(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatSalaryRange(min: number, max: number): string {
  if (!min && !max) return "Salary not disclosed";
  if (min && !max) return `${formatCurrency(min)}+`;
  if (!min && max) return `Up to ${formatCurrency(max)}`;
  return `${formatCurrency(min)} – ${formatCurrency(max)}`;
}

export function formatDate(input: string | Date, style: "short" | "long" = "short"): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  return d.toLocaleDateString(undefined, {
    year: style === "long" ? "numeric" : undefined,
    month: "short",
    day: "numeric",
  });
}

export function formatRelative(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return String(input);
  const diffMs = d.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
  return rtf.format(Math.round(diffSec / (86400 * 365)), "year");
}
