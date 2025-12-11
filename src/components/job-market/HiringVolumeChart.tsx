import React, { useEffect, useRef, useState } from 'react';

interface TrendData {
  date: string;
  category: string;
  job_count: number;
  rolling_7d: number;
  rolling_30d: number;
}

interface HiringVolumeChartProps {
  data: TrendData[];
  isDark?: boolean;
}

// Professional color palette
const LIGHT_COLORS = [
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
];

const DARK_COLORS = [
  '#60a5fa', // blue-400
  '#a78bfa', // violet-400
  '#f472b6', // pink-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#f87171', // red-400
  '#22d3ee', // cyan-400
  '#a3e635', // lime-400
];

export const HiringVolumeChart: React.FC<HiringVolumeChartProps> = ({ data, isDark = false }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [darkMode, setDarkMode] = useState(isDark);
  const [show7DayAvg, setShow7DayAvg] = useState(false);
  const [show30DayAvg, setShow30DayAvg] = useState(false);

  useEffect(() => {
    // Listen for dark mode changes
    const handleDarkModeChange = (e: CustomEvent) => {
      setDarkMode(e.detail);
    };
    window.addEventListener('darkModeChange', handleDarkModeChange as EventListener);
    
    return () => {
      window.removeEventListener('darkModeChange', handleDarkModeChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!chartRef.current || !data || data.length === 0 || typeof window === 'undefined') return;

    // Dynamically import Plotly to avoid SSR issues
    import('plotly.js-dist-min').then((Plotly) => {
      if (!chartRef.current) return;

      const colors = darkMode ? DARK_COLORS : LIGHT_COLORS;
      const bgColor = darkMode ? '#1f2937' : '#ffffff';
      const textColor = darkMode ? '#f3f4f6' : '#1f2937';
      const gridColor = darkMode ? '#374151' : '#e5e7eb';

      // Group data by category
      const categories = Array.from(new Set(data.map(d => d.category)));
      const traces: any[] = [];

      // Add raw data traces for each category
      categories.forEach((category, idx) => {
        const categoryData = data
          .filter(d => d.category === category)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        // Raw data trace (solid line)
        traces.push({
          x: categoryData.map(d => d.date),
          y: categoryData.map(d => d.job_count),
          name: category,
          type: 'scatter' as const,
          mode: 'lines+markers' as const,
          line: {
            width: 3,
            shape: 'spline' as const,
            smoothing: 1.3,
            color: colors[idx % colors.length]
          },
          marker: {
            size: 6,
            color: colors[idx % colors.length],
            line: { width: 1, color: bgColor }
          },
          hovertemplate: '<b>%{fullData.name}</b><br>' +
                         '<b>Date:</b> %{x|%b %d, %Y}<br>' +
                         '<b>Job Count:</b> %{y:,.0f}<br>' +
                         '<extra></extra>',
          legendgroup: category,
        });

        // Add 7-day rolling average if enabled
        if (show7DayAvg) {
          traces.push({
            x: categoryData.map(d => d.date),
            y: categoryData.map(d => d.rolling_7d),
            name: `${category} (7-day avg)`,
            type: 'scatter' as const,
            mode: 'lines' as const,
            line: {
              width: 2,
              dash: 'dash' as const,
              color: colors[idx % colors.length]
            },
            opacity: 0.7,
            hovertemplate: '<b>%{fullData.name}</b><br>' +
                           '<b>Date:</b> %{x|%b %d, %Y}<br>' +
                           '<b>7-day Avg:</b> %{y:,.1f}<br>' +
                           '<extra></extra>',
            legendgroup: category,
            showlegend: true,
          });
        }

        // Add 30-day rolling average if enabled
        if (show30DayAvg) {
          traces.push({
            x: categoryData.map(d => d.date),
            y: categoryData.map(d => d.rolling_30d),
            name: `${category} (30-day avg)`,
            type: 'scatter' as const,
            mode: 'lines' as const,
            line: {
              width: 2,
              dash: 'dot' as const,
              color: colors[idx % colors.length]
            },
            opacity: 0.6,
            hovertemplate: '<b>%{fullData.name}</b><br>' +
                           '<b>Date:</b> %{x|%b %d, %Y}<br>' +
                           '<b>30-day Avg:</b> %{y:,.1f}<br>' +
                           '<extra></extra>',
            legendgroup: category,
            showlegend: true,
          });
        }
      });

      const layout = {
        title: {
          text: '',
          font: { size: 20, color: textColor, family: 'Inter, sans-serif' },
        },
        xaxis: {
          title: {
            text: 'Date',
            font: { size: 14, color: textColor }
          },
          type: 'date',
          gridcolor: gridColor,
          gridwidth: 1,
          zeroline: false,
          showline: true,
          linecolor: gridColor,
        },
        yaxis: {
          title: {
            text: 'Job Count',
            font: { size: 14, color: textColor }
          },
          gridcolor: gridColor,
          gridwidth: 1,
          zeroline: false,
          showline: true,
          linecolor: gridColor,
        },
        hovermode: 'x unified' as const,
        hoverlabel: {
          bgcolor: darkMode ? '#374151' : '#ffffff',
          bordercolor: darkMode ? '#6b7280' : '#d1d5db',
          font: { color: textColor, size: 12 }
        },
        legend: {
          orientation: 'h' as const,
          yanchor: 'bottom' as const,
          y: -0.25,
          xanchor: 'center' as const,
          x: 0.5,
          font: { color: textColor, size: 12 },
          bgcolor: 'transparent',
        },
        margin: { t: 20, r: 30, b: 80, l: 70 },
        height: 550,
        plot_bgcolor: bgColor,
        paper_bgcolor: bgColor,
        font: { color: textColor, family: 'Inter, sans-serif' },
      };

      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'] as const,
        toImageButtonOptions: {
          format: 'png',
          filename: 'hiring-volume-trends',
          height: 550,
          width: 1200,
          scale: 2
        }
      };

      Plotly.default.newPlot(chartRef.current, traces, layout, config);
    });

    // Cleanup on unmount
    return () => {
      if (chartRef.current && typeof window !== 'undefined') {
        import('plotly.js-dist-min').then((Plotly) => {
          Plotly.default.purge(chartRef.current!);
        });
      }
    };
  }, [data, darkMode, show7DayAvg, show30DayAvg]);

  return (
    <div className="space-y-4">
      {/* Rolling Average Controls */}
      <div className="flex flex-wrap items-center gap-4 px-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Show rolling averages:
        </span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={show7DayAvg}
            onChange={(e) => setShow7DayAvg(e.target.checked)}
            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            7-day average (dashed)
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={show30DayAvg}
            onChange={(e) => setShow30DayAvg(e.target.checked)}
            className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            30-day average (dotted)
          </span>
        </label>
      </div>

      {/* Chart */}
      <div ref={chartRef} className="w-full" style={{ height: '550px' }} />
    </div>
  );
};

export default HiringVolumeChart;
