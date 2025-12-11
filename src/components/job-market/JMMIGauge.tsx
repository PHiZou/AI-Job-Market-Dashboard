import React from 'react';
import Plot from 'react-plotly.js';

interface JMMIComponent {
  score: number;
  status: string;
  description?: string;
}

interface JMMIInterpretation {
  label: string;
  emoji: string;
  description: string;
  for_job_seekers: string;
  for_recruiters: string;
}

interface JMMIData {
  overall_score: number;
  components: {
    posting_velocity: JMMIComponent & { change_pct: number };
    skill_velocity: JMMIComponent & { trending_skills_count: number };
    forecast_accuracy: JMMIComponent & { mape?: number };
    market_activity: JMMIComponent & { spikes: number; drops: number };
    company_diversity: JMMIComponent & { unique_companies: number };
  };
  interpretation: JMMIInterpretation;
  recommendation: string;
  calculated_at: string;
}

interface JMMIGaugeProps {
  jmmi: JMMIData;
  isDark?: boolean;
}

export const JMMIGauge: React.FC<JMMIGaugeProps> = ({ jmmi, isDark = false }) => {
  const score = jmmi.overall_score;
  const interpretation = jmmi.interpretation;

  // Determine color based on score
  const getColor = (score: number): string => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // amber
    if (score >= 40) return '#6b7280'; // gray
    if (score >= 20) return '#60a5fa'; // blue
    return '#3b82f6'; // light blue
  };

  const gaugeColor = getColor(score);
  const textColor = isDark ? '#f3f4f6' : '#111827';
  const bgColor = isDark ? '#1f2937' : '#ffffff';

  return (
    <div className="jmmi-container">
      {/* Gauge Chart */}
      <div className="flex justify-center mb-6">
        <Plot
          data={[
            {
              type: 'indicator',
              mode: 'gauge+number',
              value: score,
              number: {
                suffix: ' / 100',
                font: { size: 32, color: textColor }
              },
              gauge: {
                axis: { range: [0, 100], tickwidth: 1, tickcolor: textColor },
                bar: { color: gaugeColor, thickness: 0.75 },
                bgcolor: isDark ? '#374151' : '#e5e7eb',
                borderwidth: 2,
                bordercolor: isDark ? '#4b5563' : '#d1d5db',
                steps: [
                  { range: [0, 20], color: isDark ? '#1e3a8a' : '#dbeafe' },
                  { range: [20, 40], color: isDark ? '#1e40af' : '#bfdbfe' },
                  { range: [40, 60], color: isDark ? '#4b5563' : '#d1d5db' },
                  { range: [60, 80], color: isDark ? '#b45309' : '#fde68a' },
                  { range: [80, 100], color: isDark ? '#065f46' : '#d1fae5' }
                ],
                threshold: {
                  line: { color: gaugeColor, width: 4 },
                  thickness: 0.75,
                  value: score
                }
              }
            }
          ]}
          layout={{
            width: 400,
            height: 280,
            margin: { t: 20, r: 20, l: 20, b: 20 },
            paper_bgcolor: bgColor,
            plot_bgcolor: bgColor,
            font: { color: textColor, family: 'Inter, system-ui, sans-serif' }
          }}
          config={{ displayModeBar: false, responsive: true }}
        />
      </div>

      {/* Interpretation Card */}
      <div className={`rounded-lg p-6 mb-6 ${
        isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          <svg 
            className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            width="16"
            height="16"
            style={{ width: '16px', height: '16px', maxWidth: '16px', maxHeight: '16px', flexShrink: 0 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <div>
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {interpretation.label}
            </h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Market Momentum: {score.toFixed(1)}/100
            </p>
          </div>
        </div>
        <p className={`text-base mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {interpretation.description}
        </p>

        {/* Recommendation */}
        <div className={`p-4 rounded-md ${
          isDark ? 'bg-indigo-900/30 border border-indigo-800' : 'bg-indigo-50 border border-indigo-200'
        }`}>
          <div className="flex items-start gap-2">
            <svg 
              className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              width="16"
              height="16"
              style={{ width: '16px', height: '16px', maxWidth: '16px', maxHeight: '16px', flexShrink: 0 }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className={`text-sm ${isDark ? 'text-indigo-300' : 'text-indigo-900'}`}>
              <strong>Recommendation:</strong> {jmmi.recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* Components Breakdown */}
      <div className="space-y-4">
        <h4 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <svg 
            className="w-4 h-4 text-indigo-600 dark:text-indigo-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            width="16"
            height="16"
            style={{ width: '16px', height: '16px', maxWidth: '16px', maxHeight: '16px' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          JMMI Components
        </h4>

        {/* Posting Velocity */}
        <ComponentBar
          label="Posting Velocity"
          score={jmmi.components.posting_velocity.score}
          detail={`${jmmi.components.posting_velocity.change_pct > 0 ? '+' : ''}${jmmi.components.posting_velocity.change_pct.toFixed(1)}% change`}
          isDark={isDark}
          weight={30}
        />

        {/* Skill Velocity */}
        <ComponentBar
          label="Skill Velocity"
          score={jmmi.components.skill_velocity.score}
          detail={`${jmmi.components.skill_velocity.trending_skills_count} trending skills`}
          isDark={isDark}
          weight={25}
        />

        {/* Forecast Accuracy */}
        <ComponentBar
          label="Forecast Accuracy"
          score={jmmi.components.forecast_accuracy.score}
          detail={jmmi.components.forecast_accuracy.mape !== null
            ? `${(100 - (jmmi.components.forecast_accuracy.mape || 0)).toFixed(1)}% accurate`
            : 'Calculating...'}
          isDark={isDark}
          weight={20}
        />

        {/* Market Activity */}
        <ComponentBar
          label="Market Activity"
          score={jmmi.components.market_activity.score}
          detail={`${jmmi.components.market_activity.spikes} spikes, ${jmmi.components.market_activity.drops} drops`}
          isDark={isDark}
          weight={15}
        />

        {/* Company Diversity */}
        <ComponentBar
          label="Company Diversity"
          score={jmmi.components.company_diversity.score}
          detail={`${jmmi.components.company_diversity.unique_companies} companies hiring`}
          isDark={isDark}
          weight={10}
        />
      </div>

      {/* Insights for Different Audiences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-200'
        }`}>
          <h5 className={`font-semibold mb-2 flex items-center gap-2 ${
            isDark ? 'text-blue-300' : 'text-blue-900'
          }`}>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              width="16"
              height="16"
              style={{ width: '16px', height: '16px', maxWidth: '16px', maxHeight: '16px' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            For Job Seekers
          </h5>
          <p className={`text-sm ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
            {interpretation.for_job_seekers}
          </p>
        </div>

        <div className={`p-4 rounded-lg ${
          isDark ? 'bg-purple-900/20 border border-purple-800' : 'bg-purple-50 border border-purple-200'
        }`}>
          <h5 className={`font-semibold mb-2 flex items-center gap-2 ${
            isDark ? 'text-purple-300' : 'text-purple-900'
          }`}>
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              width="16"
              height="16"
              style={{ width: '16px', height: '16px', maxWidth: '16px', maxHeight: '16px' }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            For Recruiters
          </h5>
          <p className={`text-sm ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>
            {interpretation.for_recruiters}
          </p>
        </div>
      </div>

      {/* Methodology Note */}
      <div className={`mt-6 p-3 rounded text-xs ${
        isDark ? 'bg-gray-800 text-gray-400 border border-gray-700' : 'bg-gray-100 text-gray-600 border border-gray-200'
      }`}>
        <strong>Methodology:</strong> JMMI is computed from weighted components (Posting: 30%, Skills: 25%, Forecast: 20%, Activity: 15%, Diversity: 10%).
        Last updated: {new Date(jmmi.calculated_at).toLocaleString()}
      </div>
    </div>
  );
};

// Component Bar for breakdown
const ComponentBar: React.FC<{
  label: string;
  score: number;
  detail: string;
  isDark: boolean;
  weight: number;
}> = ({ label, score, detail, isDark, weight }) => {
  const barColor = score >= 70 ? '#10b981' : score >= 50 ? '#f59e0b' : '#6b7280';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
          {label}
          <span className={`ml-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            ({weight}% weight)
          </span>
        </span>
        <span className={`text-sm font-semibold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {score.toFixed(0)}/100
        </span>
      </div>
      <div className={`w-full h-2 rounded-full overflow-hidden ${
        isDark ? 'bg-gray-700' : 'bg-gray-200'
      }`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: barColor }}
        />
      </div>
      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
        {detail}
      </p>
    </div>
  );
};

export default JMMIGauge;
