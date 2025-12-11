import React, { useEffect, useState, Suspense, lazy } from 'react';
import DataQualityIndicator from './DataQualityIndicator';
import EmptyState from './EmptyState';
import {
  loadAllData,
  extractSkillTrendValues,
  calculateRealMoMGrowth,
  type TrendData,
  type ForecastData,
  type SkillTrend,
  type CompanyHiring,
  type Alert,
  type JMMIData
} from '../../utils/dataLoaders';

// Lazy load heavy components for code splitting
const HiringVolumeChart = lazy(() => import('./HiringVolumeChart'));
const ForecastChart = lazy(() => import('./ForecastChart'));
const SkillsLeaderboard = lazy(() => import('./SkillsLeaderboard'));
const CompanyLeaderboard = lazy(() => import('./CompanyLeaderboard'));
const AlertsPanel = lazy(() => import('./AlertsPanel'));
const MapView = lazy(() => import('./MapView'));
const JMMIGauge = lazy(() => import('./JMMIGauge'));

// Loading Skeleton Component
const LoadingSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Chart Skeletons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-[500px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-[500px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
      
      {/* Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
      
      {/* Map and Alerts Skeletons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-[400px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-[200px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [forecasts, setForecasts] = useState<ForecastData[]>([]);
  const [skills, setSkills] = useState<SkillTrend[]>([]);
  const [companies, setCompanies] = useState<CompanyHiring[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [jmmi, setJmmi] = useState<JMMIData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [totalJobs, setTotalJobs] = useState<number>(0);

  useEffect(() => {
    // Check dark mode
    const checkDarkMode = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };
    
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    // Listen for dark mode changes
    const handleDarkModeChange = (e: CustomEvent) => {
      setIsDark(e.detail);
    };
    window.addEventListener('darkModeChange', handleDarkModeChange as EventListener);

    return () => {
      observer.disconnect();
      window.removeEventListener('darkModeChange', handleDarkModeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadAllData();
        setTrends(data.trends);
        setForecasts(data.forecasts);

        // Convert SkillsData object to SkillTrend array with historical trends
        const skillsArray: SkillTrend[] = [];
        if (data.skills && data.skills.overall) {
          Object.entries(data.skills.overall).forEach(([skill, count]) => {
            // Extract historical trend values for sparklines (last 14 days)
            const trendValues = extractSkillTrendValues(skill, data.skills.by_date, 14);

            // Calculate real month-over-month growth from historical data
            const realGrowthRate = calculateRealMoMGrowth(skill, data.skills.by_date);

            skillsArray.push({
              skill,
              count: typeof count === 'number' ? count : 0,
              trend_values: trendValues.length > 0 ? trendValues : undefined,
              growth_rate: realGrowthRate,
            });
          });
        }
        setSkills(skillsArray);

        // CompanyData is compatible with CompanyHiring
        setCompanies(data.companies as CompanyHiring[]);

        setAlerts(data.alerts);
        setJmmi(data.jmmi);

        // Calculate total jobs and last updated
        const total = data.trends.reduce((sum, t) => sum + t.job_count, 0);
        setTotalJobs(total);

        // Get last updated from most recent alert
        if (data.alerts.length > 0) {
          const timestamps = data.alerts
            .map(a => a.generated_at)
            .filter(Boolean)
            .sort()
            .reverse();
          if (timestamps.length > 0) {
            setLastUpdated(timestamps[0]);
          }
        }

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800 p-8">
        <EmptyState
          title="Error Loading Dashboard"
          description={error}
          icon={
            <svg width="48" height="48" className="text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          action={{
            label: 'Retry',
            onClick: () => window.location.reload()
          }}
        />
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Make sure the ETL pipeline has been run and JSON files exist in <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">/public/data/</code>
          </p>
        </div>
      </div>
    );
  }

  // Prepare historical data for forecast chart
  const historicalData = trends.map(t => ({
    date: t.date,
    category: t.category,
    job_count: t.job_count
  }));

  // Prepare map data (mock for now - in real app, this would come from location aggregation)
  const mapData = companies.slice(0, 10).map((company, idx) => ({
    location: company.company_name || `Location ${idx + 1}`,
    latitude: 38.9 + (Math.random() - 0.5) * 0.2,
    longitude: -77.1 + (Math.random() - 0.5) * 0.3,
    job_count: company.job_count,
    top_skills: skills.slice(0, 3).map(s => s.skill)
  }));

  // Card wrapper component for consistent styling
  const Card: React.FC<{ 
    title: string; 
    description?: string; 
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
  }> = ({ title, description, icon, children, className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300 ${className}`}>
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          {icon && <div className="text-indigo-600 dark:text-indigo-400">{icon}</div>}
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        </div>
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 ml-0 md:ml-9">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Job Market Momentum Index */}
      {jmmi && (
        <Card
          title="Job Market Momentum Index (JMMI)"
          description="Composite metric quantifying hiring market velocity across 5 dimensions"
          icon={
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        >
          <Suspense fallback={<div className="h-[600px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
            <JMMIGauge jmmi={jmmi} isDark={isDark} />
          </Suspense>
        </Card>
      )}

      {/* Hiring Volume Trends */}
      <Card
        title="Hiring Volume Trends"
        description="Job posting trends by category over time"
        icon={
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      >
        {trends.length > 0 ? (
          <Suspense fallback={<div className="h-[550px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
            <HiringVolumeChart data={trends} isDark={isDark} />
          </Suspense>
        ) : (
          <EmptyState
            title="No Trend Data Available"
            description="Run the ETL pipeline to generate hiring trend data. The pipeline fetches job postings, processes them, and generates time-series analytics."
            icon={
              <svg width="48" height="48" className="text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        )}
      </Card>

      {/* Forecast Chart */}
      <Card
        title="30-Day Forecast"
        description="Predicted hiring volume using Prophet time-series forecasting"
        icon={
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      >
        {forecasts.length > 0 ? (
          <Suspense fallback={<div className="h-[550px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
            <ForecastChart forecastData={forecasts} historicalData={historicalData} isDark={isDark} />
          </Suspense>
        ) : (
          <EmptyState
            title="No Forecast Data Available"
            description="Forecasts require at least 10 data points per category. The system uses Prophet time-series forecasting to predict future hiring volume."
            icon={
              <svg width="48" height="48" className="text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        )}
      </Card>

      {/* Skills and Companies Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card
          title="Top Skills"
          description="Most in-demand skills in the NOVA/DC job market"
          icon={
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          }
          className=""
        >
          <div data-section="skills">
          {skills.length > 0 ? (
            <Suspense fallback={<div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
              <SkillsLeaderboard data={skills} />
            </Suspense>
          ) : (
            <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p>No skills data available.</p>
            </div>
          )}
          </div>
        </Card>

        <Card
          title="Top Companies"
          description="Companies with the most active job postings"
          icon={
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        >
          <div data-section="companies">
          {companies.length > 0 ? (
            <Suspense fallback={<div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
              <CompanyLeaderboard data={companies} />
            </Suspense>
          ) : (
            <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
              <p>No company data available.</p>
            </div>
          )}
          </div>
        </Card>
      </div>

      {/* Map View */}
      <Card
        title="Geographic Distribution"
        description="Job postings across the NOVA/DC metropolitan area"
        icon={
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      >
        <Suspense fallback={<div className="h-[400px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
          <MapView data={mapData} />
        </Suspense>
      </Card>

      {/* Alerts */}
      <Card
        title="Market Alerts"
        description="Real-time notifications about market trends and anomalies"
        icon={
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        }
      >
        {alerts.length > 0 ? (
          <Suspense fallback={<div className="h-[200px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />}>
            <AlertsPanel alerts={alerts} />
          </Suspense>
        ) : (
          <div className="text-center py-12 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <p>No active alerts. The job market appears stable.</p>
          </div>
          )}
        </Card>

        {/* Data Quality Footer */}
        <DataQualityIndicator
          totalJobs={totalJobs}
          lastUpdated={lastUpdated || undefined}
          confidence={totalJobs > 100 ? 'high' : totalJobs > 50 ? 'medium' : 'low'}
        />
    </div>
  );
};

export default Dashboard;
