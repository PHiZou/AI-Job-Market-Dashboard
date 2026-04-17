import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "About · AI Job Market Intelligence",
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            About this dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            A full-stack portfolio piece that surfaces hiring signals from
            aggregated job postings: volume trends, trending skills, active
            employers, anomalies, and 30-day forecasts — all wrapped in a
            modern, accessible interface.
          </p>
        </section>

        <Card>
          <CardHeader title="Tech stack" />
          <CardBody>
            <ul className="grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
              <Tech label="Next.js 15" detail="App Router · Server Components · Route Handlers" />
              <Tech label="React 19" detail="Typed client components, transitions" />
              <Tech label="TypeScript" detail="End-to-end type safety" />
              <Tech label="Tailwind v4" detail="CSS-first configuration" />
              <Tech label="Recharts" detail="Composable, SSR-friendly charts" />
              <Tech label="next-themes" detail="System-aware dark mode" />
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Features" />
          <CardBody>
            <ul className="grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
              <li>Composite Job Market Momentum Index (JMMI)</li>
              <li>30-day forecast with confidence interval</li>
              <li>Rolling 7-day/30-day hiring volume</li>
              <li>Skills leaderboard with sparklines + pinning</li>
              <li>Company leaderboard with salary ranges</li>
              <li>Anomaly alerts (spikes, drops, skill trends)</li>
              <li>Geographic distribution map</li>
              <li>
                Global search (<kbd className="rounded border px-1 text-xs">⌘K</kbd>)
              </li>
              <li>Persistent filter preferences (localStorage)</li>
              <li>Public read-only JSON API</li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Data API" description="Each dataset is served as JSON." />
          <CardBody>
            <ul className="space-y-1 text-sm">
              {[
                ["/api/trends", "Daily hiring volume by category"],
                ["/api/skills", "Overall skill frequency map"],
                ["/api/companies", "Top hiring companies with salary ranges"],
                ["/api/forecasts", "30-day forecasts with confidence intervals"],
                ["/api/alerts", "Detected spikes, drops, and skill trends"],
                ["/api/jmmi", "Job Market Momentum Index"],
                ["/api/search?q=...", "Global search across all datasets"],
              ].map(([path, desc]) => (
                <li key={path} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3">
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                    GET {path}
                  </code>
                  <span className="text-slate-600 dark:text-slate-400">{desc}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <div className="text-sm">
          <Link
            href="/"
            className="text-indigo-600 hover:underline dark:text-indigo-400"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    </>
  );
}

function Tech({ label, detail }: { label: string; detail: string }) {
  return (
    <li>
      <span className="font-medium text-slate-900 dark:text-slate-100">{label}</span>
      <span className="text-slate-500 dark:text-slate-400"> — {detail}</span>
    </li>
  );
}
