import React, { useState } from 'react';

interface Alert {
  id: string;
  type: 'spike' | 'drop' | 'skill_trend';
  severity: 'high' | 'medium' | 'low';
  category?: string;
  skill?: string;
  date?: string;
  message: string;
  job_count?: number;
  expected_count?: number;
  z_score?: number;
  pct_change?: number;
  growth_rate?: number;
  generated_at?: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
  limit?: number;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, limit = 20 }) => {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'spike' | 'drop' | 'skill_trend'>('all');

  const filteredAlerts = alerts
    .filter(alert => filterType === 'all' || alert.type === filterType)
    .slice(0, limit);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return '#e53e3e';
      case 'medium':
        return '#ed8936';
      case 'low':
        return '#38a169';
      default:
        return '#718096';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'spike':
        return '📈';
      case 'drop':
        return '📉';
      case 'skill_trend':
        return '🔥';
      default:
        return '⚠️';
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Filter alerts by type">
        <button
          onClick={() => setFilterType('all')}
          className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-gray-300 dark:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            backgroundColor: filterType === 'all' ? '#3b82f6' : 'transparent',
            color: filterType === 'all' ? 'white' : '#374151',
            fontWeight: filterType === 'all' ? 600 : 400
          }}
          aria-label={`Show all alerts (${alerts.length} total)`}
          aria-pressed={filterType === 'all'}
          role="tab"
          type="button"
        >
          All ({alerts.length})
        </button>
        <button
          onClick={() => setFilterType('spike')}
          className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-gray-300 dark:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            backgroundColor: filterType === 'spike' ? '#3b82f6' : 'transparent',
            color: filterType === 'spike' ? 'white' : '#374151',
            fontWeight: filterType === 'spike' ? 600 : 400
          }}
          aria-label={`Show spike alerts (${alerts.filter(a => a.type === 'spike').length} total)`}
          aria-pressed={filterType === 'spike'}
          role="tab"
          type="button"
        >
          Spikes ({alerts.filter(a => a.type === 'spike').length})
        </button>
        <button
          onClick={() => setFilterType('drop')}
          className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-gray-300 dark:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            backgroundColor: filterType === 'drop' ? '#3b82f6' : 'transparent',
            color: filterType === 'drop' ? 'white' : '#374151',
            fontWeight: filterType === 'drop' ? 600 : 400
          }}
          aria-label={`Show drop alerts (${alerts.filter(a => a.type === 'drop').length} total)`}
          aria-pressed={filterType === 'drop'}
          role="tab"
          type="button"
        >
          Drops ({alerts.filter(a => a.type === 'drop').length})
        </button>
        <button
          onClick={() => setFilterType('skill_trend')}
          className="px-3 py-1.5 text-xs md:text-sm rounded-md border border-gray-300 dark:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            backgroundColor: filterType === 'skill_trend' ? '#3b82f6' : 'transparent',
            color: filterType === 'skill_trend' ? 'white' : '#374151',
            fontWeight: filterType === 'skill_trend' ? 600 : 400
          }}
          aria-label={`Show skill trend alerts (${alerts.filter(a => a.type === 'skill_trend').length} total)`}
          aria-pressed={filterType === 'skill_trend'}
          role="tab"
          type="button"
        >
          Trends ({alerts.filter(a => a.type === 'skill_trend').length})
        </button>
      </div>

      <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#718096' }}>
            No alerts available
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlert === alert.id;
            return (
              <div
                key={alert.id}
                className="border-2 rounded-lg p-3 mb-2 cursor-pointer transition-all dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{
                  borderColor: getSeverityColor(alert.severity),
                  backgroundColor: isExpanded ? '#f7fafc' : 'transparent',
                }}
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setExpandedAlert(isExpanded ? null : alert.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                aria-label={`${alert.message}. ${alert.severity} severity. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1rem', lineHeight: '1', display: 'inline-block' }}>{getTypeIcon(alert.type)}</span>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: '0.25rem', fontSize: '0.875rem' }}>
                        {alert.message}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#718096' }}>
                        {alert.date && `Date: ${alert.date}`}
                        {alert.category && ` • Category: ${alert.category}`}
                        {alert.skill && ` • Skill: ${alert.skill}`}
                      </div>
                    </div>
                  </div>
                  <div
                    className="px-2 py-1 rounded text-xs font-semibold uppercase text-white"
                    style={{
                      backgroundColor: getSeverityColor(alert.severity),
                    }}
                  >
                    {alert.severity}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-sm">
                    {alert.job_count !== undefined && (
                      <div className="mb-1.5">
                        <strong>Job Count:</strong> {alert.job_count}
                      </div>
                    )}
                    {alert.expected_count !== undefined && (
                      <div className="mb-1.5">
                        <strong>Expected Count:</strong> {alert.expected_count.toFixed(1)}
                      </div>
                    )}
                    {alert.z_score !== undefined && (
                      <div className="mb-1.5">
                        <strong>Z-Score:</strong> {alert.z_score.toFixed(2)}
                      </div>
                    )}
                    {alert.pct_change !== undefined && (
                      <div className="mb-1.5">
                        <strong>Percentage Change:</strong> {alert.pct_change.toFixed(1)}%
                      </div>
                    )}
                    {alert.growth_rate !== undefined && (
                      <div className="mb-1.5">
                        <strong>Growth Rate:</strong> {alert.growth_rate.toFixed(1)}%
                      </div>
                    )}
                    {alert.generated_at && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Generated: {new Date(alert.generated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;

