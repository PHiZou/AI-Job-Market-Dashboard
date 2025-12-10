import React from 'react';
import { formatDate } from '../../utils/formatters';

interface DataQualityIndicatorProps {
  totalJobs?: number;
  lastUpdated?: string;
  dataSource?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export const DataQualityIndicator: React.FC<DataQualityIndicatorProps> = ({
  totalJobs,
  lastUpdated,
  dataSource = 'JSearch API',
  confidence = 'high'
}) => {
  const confidenceColors = {
    high: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30',
    medium: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30',
    low: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
  };

  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
      {totalJobs !== undefined && (
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Based on <strong className="text-gray-900 dark:text-gray-100">{totalJobs.toLocaleString()}</strong> job postings</span>
        </div>
      )}
      {lastUpdated && (
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Updated {formatDate(lastUpdated, 'relative')}</span>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Source: {dataSource}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className={`px-2 py-0.5 rounded-full font-medium ${confidenceColors[confidence]}`}>
          {confidence === 'high' ? '✓ High Confidence' : confidence === 'medium' ? '~ Medium Confidence' : '⚠ Low Confidence'}
        </span>
      </div>
    </div>
  );
};

export default DataQualityIndicator;

