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
      const traces = categories.map((category, idx) => {
        const categoryData = data
          .filter(d => d.category === category)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        return {
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
        };
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
  }, [data, darkMode]);

  return <div ref={chartRef} className="w-full" style={{ height: '550px' }} />;
};

export default HiringVolumeChart;
