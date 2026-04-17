import { NextResponse } from "next/server";
import { loadDashboard } from "@/lib/data";

interface SearchHit {
  kind: "skill" | "company" | "alert" | "category";
  label: string;
  detail: string;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) {
    return NextResponse.json({ query: "", results: [] satisfies SearchHit[] });
  }

  const data = await loadDashboard();
  const results: SearchHit[] = [];

  for (const [skill, count] of Object.entries(data.skills.overall)) {
    if (skill.toLowerCase().includes(q)) {
      results.push({ kind: "skill", label: skill, detail: `${count} mentions` });
    }
  }
  for (const c of data.companies) {
    if (c.company_name.toLowerCase().includes(q)) {
      results.push({
        kind: "company",
        label: c.company_name,
        detail: `${c.job_count} jobs · ${c.primary_category}`,
      });
    }
  }
  for (const a of data.alerts) {
    if (a.category.toLowerCase().includes(q) || a.message.toLowerCase().includes(q)) {
      results.push({ kind: "alert", label: a.category, detail: a.message });
    }
  }
  const seen = new Set<string>();
  for (const t of data.trends) {
    if (!t.category.toLowerCase().includes(q)) continue;
    if (seen.has(t.category)) continue;
    seen.add(t.category);
    results.push({ kind: "category", label: t.category, detail: "Category trend" });
  }

  return NextResponse.json({ query: q, results: results.slice(0, 25) });
}
