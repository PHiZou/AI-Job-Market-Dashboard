import React, { useState, useMemo } from 'react';
import type { CompanyHiring } from '../../utils/dataLoaders';
import { formatPercentage, formatNumber } from '../../utils/formatters';

interface CompanyLeaderboardProps {
  data: CompanyHiring[];
  limit?: number;
}

// Generate company initials for logo placeholder
const getInitials = (name: string): string => {
  const words = name.split(/\s+/).filter(w => w.length > 0);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Generate a color based on company name
const getCompanyColor = (name: string): string => {
  const colors = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500',
    'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-blue-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const CompanyLeaderboard: React.FC<CompanyLeaderboardProps> = ({
  data,
  limit = 20
}) => {
  const [sortColumn, setSortColumn] = useState<'jobs' | 'name'>('jobs');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const sortedData = useMemo(() => {
    let filtered = data.filter(company =>
      company.company_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortColumn === 'jobs') {
        comparison = a.job_count - b.job_count;
      } else {
        comparison = a.company_name.localeCompare(b.company_name);
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted.slice(0, limit);
  }, [data, sortColumn, sortDirection, limit, searchQuery]);

  const handleSort = (column: 'jobs' | 'name') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Get week-over-week comparison from company data
  const getWeekComparison = (company: CompanyHiring) => {
    // Use real WoW data if available, otherwise return no change
    const pctChange = company.wow_change ?? 0;
    const prevWeek = pctChange !== 0 ? Math.round(company.job_count / (1 + pctChange / 100)) : company.job_count;
    return { prevWeek, pctChange };
  };

  const getHiringTrend = (pctChange: number): { label: 'Rapidly Growing' | 'Stable' | 'Declining'; color: string; bgColor: string; icon: string } => {
    if (pctChange > 10) {
      return { 
        label: 'Rapidly Growing', 
        color: 'text-green-700 dark:text-green-300', 
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        icon: '📈'
      };
    } else if (pctChange < -10) {
      return { 
        label: 'Declining', 
        color: 'text-red-700 dark:text-red-300', 
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        icon: '📉'
      };
    }
    return { 
      label: 'Stable', 
      color: 'text-gray-700 dark:text-gray-300', 
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      icon: '➡️'
    };
  };

  const getBestTimeToApply = (jobCount: number, pctChange: number): string => {
    if (pctChange > 15) {
      return 'Apply now - rapid growth';
    } else if (pctChange > 5) {
      return 'Good time to apply';
    } else if (pctChange < -10) {
      return 'Limited openings';
    }
    return 'Stable hiring';
  };

  const maxJobs = sortedData.length > 0 ? Math.max(...sortedData.map(c => c.job_count)) : 1;

  return (
    <div className="space-y-4">
      {/* Search */}
      <input
        type="text"
        placeholder="Search companies..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label="Search companies by name"
      />

      {/* Companies Table */}
      <div className="overflow-x-auto">
        {sortedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No companies found matching "{searchQuery}"
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm" role="table" aria-label="Top companies leaderboard">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                      aria-label="Sort by company name"
                      aria-pressed={sortColumn === 'name'}
                      type="button"
                    >
                      Company
                      {sortColumn === 'name' && (
                        <span className="text-xs" aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('jobs')}
                      className="flex items-center gap-1 ml-auto hover:text-gray-900 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                      aria-label="Sort by job count"
                      aria-pressed={sortColumn === 'jobs'}
                      type="button"
                    >
                      Jobs
                      {sortColumn === 'jobs' && (
                        <span className="text-xs" aria-hidden="true">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  </th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Trend</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">vs Last Week</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((company, index) => {
                  const { prevWeek, pctChange } = getWeekComparison(company);
                  const isPositive = pctChange > 0;
                  const initials = getInitials(company.company_name);
                  const color = getCompanyColor(company.company_name);
                  const trend = getHiringTrend(pctChange);
                  const bestTime = getBestTimeToApply(company.job_count, pctChange);

                  return (
                    <tr
                      key={company.company_name}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center text-white font-semibold text-xs flex-shrink-0`}>
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {company.company_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5" title={bestTime}>
                              {bestTime}
                            </div>
                            {company.primary_category && (
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                {company.primary_category}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatNumber(company.job_count)}
                        </div>
                        <div className="mt-1 w-24 ml-auto h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${(company.job_count / maxJobs) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${trend.bgColor} ${trend.color}`}
                          title={`Hiring trend: ${trend.label}`}
                        >
                          <span>{trend.icon}</span>
                          <span className="hidden sm:inline">{trend.label}</span>
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {formatNumber(prevWeek)}
                          </span>
                          <span
                            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                              isPositive
                                ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
                                : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                            }`}
                          >
                            {formatPercentage(pctChange)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyLeaderboard;
