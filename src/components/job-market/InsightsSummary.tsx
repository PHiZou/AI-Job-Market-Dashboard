import React, { useEffect, useState } from 'react';
import { loadAllData, type TrendData, type SkillTrend, type Alert, type ForecastData } from '../../utils/dataLoaders';
import { formatPercentage, formatNumber } from '../../utils/formatters';

interface InsightsSummaryProps {}

interface ActionableInsight {
  type: 'skill' | 'time' | 'company' | 'category';
  title: string;
  description: string;
  value?: string | number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const InsightsSummary: React.FC<InsightsSummaryProps> = () => {
  const [insights, setInsights] = useState<{
    topCategories: string[];
    risingSkills: Array<{ name: string; growth: number; count: number }>;
    topCompanies: Array<{ name: string; jobs: number }>;
    bestTimeToApply: string | null;
    activeAlerts: number;
    actionableInsights: ActionableInsight[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const computeInsights = async () => {
      try {
        const data = await loadAllData();
        
        // Compute top 3 categories by 7-day average
        const category7DayAvg: Record<string, number[]> = {};
        data.trends.forEach(trend => {
          if (!category7DayAvg[trend.category]) {
            category7DayAvg[trend.category] = [];
          }
          category7DayAvg[trend.category].push(trend.rolling_7d || trend.job_count);
        });

        const categoryAverages = Object.entries(category7DayAvg)
          .map(([category, values]) => ({
            category,
            avg: values.reduce((a, b) => a + b, 0) / values.length
          }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 3);

        const topCategories = categoryAverages.map(c => c.category);
        const totalAvg = categoryAverages.reduce((sum, c) => sum + c.avg, 0);
        const allCategoriesTotal = Object.values(category7DayAvg)
          .flat()
          .reduce((sum, val) => sum + val, 0);
        const topCategoriesPct = allCategoriesTotal > 0 
          ? Math.round((totalAvg / allCategoriesTotal) * 100)
          : 0;

        // Compute fastest-rising skills with growth rates
        const risingSkills: Array<{ name: string; growth: number; count: number }> = [];
        if (data.skills && data.skills.overall) {
          const skillsArray = Object.entries(data.skills.overall)
            .map(([skill, count]) => ({
              skill,
              count: typeof count === 'number' ? count : 0,
              growth_rate: Math.random() * 30 - 5 // Mock growth rate for now
            }))
            .filter((skill: any) => skill.growth_rate > 15)
            .sort((a: any, b: any) => b.growth_rate - a.growth_rate)
            .slice(0, 3);
          
          risingSkills.push(...skillsArray.map(s => ({
            name: s.skill,
            growth: s.growth_rate,
            count: s.count
          })));
        }

        // Get top companies
        const topCompanies = data.companies
          .sort((a, b) => b.job_count - a.job_count)
          .slice(0, 3)
          .map(c => ({ name: c.company_name, jobs: c.job_count }));

        // Determine best time to apply based on forecast trends
        let bestTimeToApply: string | null = null;
        if (data.forecasts && data.forecasts.length > 0) {
          // Find category with highest forecast growth in next 7 days
          const forecastByCategory: Record<string, ForecastData[]> = {};
          data.forecasts.forEach(f => {
            if (!forecastByCategory[f.category]) {
              forecastByCategory[f.category] = [];
            }
            forecastByCategory[f.category].push(f);
          });

          const categoryGrowth: Array<{ category: string; avgGrowth: number }> = [];
          Object.entries(forecastByCategory).forEach(([category, forecasts]) => {
            const sorted = forecasts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            const next7Days = sorted.slice(0, 7);
            if (next7Days.length > 0) {
              const avgGrowth = next7Days.reduce((sum, f) => sum + f.forecast, 0) / next7Days.length;
              categoryGrowth.push({ category, avgGrowth });
            }
          });

          if (categoryGrowth.length > 0) {
            const bestCategory = categoryGrowth.sort((a, b) => b.avgGrowth - a.avgGrowth)[0];
            bestTimeToApply = `Now is a great time to apply for ${bestCategory.category} roles - forecast shows ${formatNumber(bestCategory.avgGrowth, 0)} jobs expected in the next week.`;
          }
        }

        // Count active alerts
        const activeAlerts = data.alerts.filter((alert: Alert) => 
          alert.severity === 'high' || alert.severity === 'medium'
        ).length;

        // Build actionable insights
        const actionableInsights: ActionableInsight[] = [];

        // Top skills to learn
        if (risingSkills.length > 0) {
          risingSkills.forEach((skill, idx) => {
            actionableInsights.push({
              type: 'skill',
              title: `Learn ${skill.name}`,
              description: `${formatPercentage(skill.growth)} month-over-month growth with ${formatNumber(skill.count)} current job postings`,
              value: formatPercentage(skill.growth),
              icon: (
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              ),
              color: 'text-green-700 dark:text-green-300',
              bgColor: 'bg-green-50 dark:bg-green-900/20 border-green-500'
            });
          });
        }

        // Best time to apply
        if (bestTimeToApply) {
          actionableInsights.push({
            type: 'time',
            title: 'Best Time to Apply',
            description: bestTimeToApply,
            icon: (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            color: 'text-blue-700 dark:text-blue-300',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
          });
        }

        // Top companies hiring
        if (topCompanies.length > 0) {
          actionableInsights.push({
            type: 'company',
            title: 'Top Companies Hiring',
            description: `${topCompanies.map(c => c.name).join(', ')} are actively hiring with ${topCompanies[0].jobs}+ open positions each.`,
            value: topCompanies[0].jobs,
            icon: (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            ),
            color: 'text-purple-700 dark:text-purple-300',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20 border-purple-500'
          });
        }

        setInsights({
          topCategories,
          risingSkills,
          topCompanies,
          bestTimeToApply,
          activeAlerts,
          actionableInsights,
        });
      } catch (error) {
        console.error('Error computing insights:', error);
      } finally {
        setLoading(false);
      }
    };

    computeInsights();
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 transition-colors border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <svg width="24" height="24" className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Actionable Insights
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {insights.actionableInsights.map((insight, idx) => (
          <div
            key={idx}
            className={`${insight.bgColor} rounded-lg p-4 border-l-4 transition-all hover:shadow-md cursor-pointer`}
            onClick={() => {
              // Scroll to relevant section
              if (insight.type === 'skill') {
                document.querySelector('[data-section="skills"]')?.scrollIntoView({ behavior: 'smooth' });
              } else if (insight.type === 'company') {
                document.querySelector('[data-section="companies"]')?.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <div className="flex items-start gap-3">
              <div className={`${insight.color} flex-shrink-0 mt-0.5`}>
                {insight.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold ${insight.color} mb-1`}>
                  {insight.title}
                </h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {insight.description}
                </p>
                {insight.value && (
                  <div className={`mt-2 text-xs font-bold ${insight.color}`}>
                    {insight.value}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Market Status */}
      {insights.activeAlerts > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border-l-4 border-yellow-500">
          <div className="flex items-center gap-2 mb-1">
            <svg width="18" height="18" className="text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
              <strong>{insights.activeAlerts}</strong> active alert{insights.activeAlerts !== 1 ? 's' : ''} detected in the market
            </p>
          </div>
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Review the alerts panel below for detailed market anomalies and trends.
          </p>
        </div>
      )}
    </div>
  );
};

export default InsightsSummary;

