import React, { useState, useMemo } from 'react';
import type { SkillTrend } from '../../utils/dataLoaders';
import { formatPercentage } from '../../utils/formatters';

interface SkillsLeaderboardProps {
  data: SkillTrend[];
  timeRange?: '7d' | '30d' | '90d' | 'all';
  limit?: number;
}

// Generate a simple sparkline SVG
const Sparkline: React.FC<{ values: number[]; color: string }> = ({ values, color }) => {
  if (values.length < 2) return null;

  const width = 60;
  const height = 20;
  const padding = 2;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const points = values.map((val, idx) => {
    const x = padding + (idx / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const SkillsLeaderboard: React.FC<SkillsLeaderboardProps> = ({
  data,
  timeRange = '30d',
  limit = 20
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'count' | 'growth'>('count');

  const skillsList = useMemo(() => {
    // Filter by search query
    let filtered = data.filter(skill =>
      skill.skill.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === 'growth') {
        const aGrowth = a.growth_rate || 0;
        const bGrowth = b.growth_rate || 0;
        return bGrowth - aGrowth;
      }
      return b.count - a.count;
    });

    return filtered.slice(0, limit);
  }, [data, searchQuery, sortBy, limit]);

  const getMoMIndicator = (growthRate?: number) => {
    if (!growthRate) return { icon: '—', color: 'text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' };
    if (growthRate > 15) return { icon: '↑', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    if (growthRate < -15) return { icon: '↓', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' };
    return { icon: '—', color: 'text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' };
  };

  const getMarketDemand = (count: number, maxCount: number): { level: 'High' | 'Medium' | 'Low'; color: string; bgColor: string } => {
    const percentage = (count / maxCount) * 100;
    if (percentage > 50) {
      return { level: 'High', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    } else if (percentage > 20) {
      return { level: 'Medium', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
    }
    return { level: 'Low', color: 'text-gray-600 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700' };
  };

  const shouldShowLearnBadge = (growthRate?: number): boolean => {
    return growthRate !== undefined && growthRate > 15;
  };

  const getRelatedSkills = (skillName: string, allSkills: SkillTrend[]): string[] => {
    // Simple related skills logic - in a real app, this would use semantic similarity
    const related: string[] = [];
    const skillLower = skillName.toLowerCase();
    
    // Find skills that share common words or are similar
    allSkills.forEach(s => {
      if (s.skill.toLowerCase() !== skillLower) {
        const sLower = s.skill.toLowerCase();
        // Check for common patterns (e.g., "Python" -> "Python3", "JavaScript" -> "TypeScript")
        if (sLower.includes(skillLower) || skillLower.includes(sLower)) {
          related.push(s.skill);
        }
      }
    });
    
    return related.slice(0, 3);
  };

  // Get trend data from skill's historical values or generate fallback
  const getTrendData = (skill: SkillTrend): number[] => {
    // Use real historical data if available
    if (skill.trend_values && skill.trend_values.length >= 2) {
      return skill.trend_values;
    }

    // Fallback to a simple line if no historical data
    return [skill.count, skill.count];
  };

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search skills..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Search skills by name"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('count')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              sortBy === 'count'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label="Sort by job count"
            aria-pressed={sortBy === 'count'}
            type="button"
          >
            Jobs (30d)
          </button>
          <button
            onClick={() => setSortBy('growth')}
            className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              sortBy === 'growth'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            aria-label="Sort by month-over-month growth"
            aria-pressed={sortBy === 'growth'}
            type="button"
          >
            MoM Growth
          </button>
        </div>
      </div>

      {/* Skills Table */}
      <div className="overflow-x-auto">
        {skillsList.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No skills found matching "{searchQuery}"
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-sm" role="table" aria-label="Top skills leaderboard">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Rank</th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Skill</th>
                  <th scope="col" className="px-3 py-2 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Jobs (30d)</th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Demand</th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Trend</th>
                  <th scope="col" className="px-3 py-2 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">MoM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {skillsList.map((skill, index) => {
                  const mom = getMoMIndicator(skill.growth_rate);
                  const trendData = getTrendData(skill);
                  const maxCount = Math.max(...skillsList.map(s => s.count));

                  return (
                    <tr
                      key={skill.skill}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {skill.skill}
                          </div>
                          {shouldShowLearnBadge(skill.growth_rate) && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              title={`High growth skill - ${formatPercentage(skill.growth_rate || 0)} MoM growth`}
                            >
                              <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              Learn
                            </span>
                          )}
                        </div>
                        {getRelatedSkills(skill.skill, skillsList).length > 0 && (
                          <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Related: {getRelatedSkills(skill.skill, skillsList).join(', ')}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {skill.count.toLocaleString()}
                        </div>
                        <div className="mt-1 w-24 ml-auto h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${(skill.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {(() => {
                          const demand = getMarketDemand(skill.count, maxCount);
                          return (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${demand.bgColor} ${demand.color}`}
                              title={`Market demand: ${demand.level}`}
                            >
                              {demand.level}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Sparkline
                          values={trendData}
                          color={skill.growth_rate && skill.growth_rate > 0 ? '#10b981' : '#ef4444'}
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium ${mom.color} ${mom.bgColor}`}
                            title={skill.growth_rate ? `${skill.growth_rate > 0 ? '+' : ''}${skill.growth_rate.toFixed(1)}%` : 'No data'}
                          >
                            {mom.icon}
                          </span>
                          {skill.growth_rate && (
                            <span className={`text-xs ${mom.color}`}>
                              {formatPercentage(skill.growth_rate)}
                            </span>
                          )}
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

export default SkillsLeaderboard;
