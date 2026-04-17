import { loadDashboard } from "@/lib/data";
import { Navbar } from "@/components/Navbar";
import { InsightsSummary } from "@/components/dashboard/InsightsSummary";
import { JMMIGauge } from "@/components/dashboard/JMMIGauge";
import { HiringVolumeChart } from "@/components/dashboard/HiringVolumeChart";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { SkillsLeaderboard } from "@/components/dashboard/SkillsLeaderboard";
import { CompanyLeaderboard } from "@/components/dashboard/CompanyLeaderboard";
import { MapView } from "@/components/dashboard/MapView";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { DataQualityIndicator } from "@/components/dashboard/DataQualityIndicator";

export const revalidate = 3600;

export default async function DashboardPage() {
  const data = await loadDashboard();

  return (
    <>
      <Navbar data={data} />
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Job Market Intelligence
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
            Daily-updated hiring trends, trending skills, active employers, and
            forecasts across the AI-driven job market.
          </p>
        </section>

        <InsightsSummary data={data} />

        <section id="jmmi">
          <JMMIGauge jmmi={data.jmmi} />
        </section>

        <section id="trends">
          <HiringVolumeChart trends={data.trends} />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section id="forecast">
            <ForecastChart forecasts={data.forecasts} />
          </section>
          <section id="alerts">
            <AlertsPanel alerts={data.alerts} />
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section id="skills">
            <SkillsLeaderboard skills={data.skills} />
          </section>
          <section id="companies">
            <CompanyLeaderboard companies={data.companies} />
          </section>
        </div>

        <section id="map">
          <MapView companies={data.companies} />
        </section>

        <footer className="border-t border-slate-200/70 pt-4 dark:border-slate-800/70">
          <DataQualityIndicator data={data} />
        </footer>
      </main>
    </>
  );
}
