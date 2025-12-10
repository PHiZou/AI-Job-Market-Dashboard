import React, { useEffect, useRef, useState } from 'react';

interface ForecastData {
  date: string;
  category: string;
  forecast: number;
  forecast_lower: number;
  forecast_upper: number;
}

interface ForecastChartProps {
  forecastData: ForecastData[];
  historicalData?: Array<{
    date: string;
    category: string;
    job_count: number;
  }>;
  isDark?: boolean;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ forecastData, historicalData = [], isDark = false }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
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
    if (!chartRef.current || !forecastData || forecastData.length === 0 || typeof window === 'undefined') return;

    // Dynamically import Plotly to avoid SSR issues
    import('plotly.js-dist-min').then((Plotly) => {
      if (!chartRef.current) return;

      const bgColor = darkMode ? '#1f2937' : '#ffffff';
      const textColor = darkMode ? '#f3f4f6' : '#1f2937';
      const gridColor = darkMode ? '#374151' : '#e5e7eb';
      const historicalColor = darkMode ? '#60a5fa' : '#3b82f6';
      const forecastColor = darkMode ? '#34d399' : '#10b981';
      const confidenceColor = darkMode ? 'rgba(52, 211, 153, 0.2)' : 'rgba(16, 185, 129, 0.2)';

      const categories = Array.from(new Set(forecastData.map(d => d.category)));
      const displayCategory = selectedCategory === 'All' ? categories[0] : selectedCategory;

      // Filter data for selected category
      const categoryForecast = forecastData
        .filter(d => d.category === displayCategory)
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });

      const categoryHistorical = historicalData
        .filter(d => d.category === displayCategory)
        .sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });

      const traces: any[] = [];

      // Historical data
      if (categoryHistorical.length > 0) {
        traces.push({
          x: categoryHistorical.map(d => d.date),
          y: categoryHistorical.map(d => d.job_count),
          name: 'Historical',
          type: 'scatter',
          mode: 'lines+markers',
          line: { 
            color: historicalColor, 
            width: 3,
            shape: 'spline' as const,
            smoothing: 1.3
          },
          marker: { 
            size: 6,
            color: historicalColor,
            line: { width: 1, color: bgColor }
          },
          hovertemplate: '<b>Historical</b><br>' +
                         '<b>Date:</b> %{x|%b %d, %Y}<br>' +
                         '<b>Job Count:</b> %{y:,.0f}<br>' +
                         '<extra></extra>',
        });
      }

      // Confidence interval (draw first so it's behind the forecast line)
      traces.push({
        x: [...categoryForecast.map(d => d.date), ...categoryForecast.map(d => d.date).reverse()],
        y: [
          ...categoryForecast.map(d => d.forecast_upper),
          ...categoryForecast.map(d => d.forecast_lower).reverse()
        ],
        name: 'Confidence Interval',
        type: 'scatter',
        mode: 'lines',
        fill: 'toself',
        fillcolor: confidenceColor,
        line: { color: 'transparent' },
        showlegend: true,
        hoverinfo: 'skip' as const,
      });

      // Forecast line (draw on top)
      traces.push({
        x: categoryForecast.map(d => d.date),
        y: categoryForecast.map(d => d.forecast),
        name: 'Forecast',
        type: 'scatter',
        mode: 'lines',
        line: { 
          color: forecastColor, 
          width: 4, 
          dash: 'dash' as const,
          shape: 'spline' as const,
          smoothing: 1.3
        },
        hovertemplate: '<b>Forecast</b><br>' +
                       '<b>Date:</b> %{x|%b %d, %Y}<br>' +
                       '<b>Forecast:</b> %{y:,.0f} jobs<br>' +
                       '<b>Range:</b> %{customdata.lower:,.0f} - %{customdata.upper:,.0f}<br>' +
                       '<extra></extra>',
        customdata: categoryForecast.map(d => ({
          lower: d.forecast_lower,
          upper: d.forecast_upper
        })),
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
          y: -0.2,
          xanchor: 'center' as const,
          x: 0.5,
          font: { color: textColor, size: 12 },
          bgcolor: 'transparent',
        },
        margin: { t: 20, r: 30, b: 80, l: 70 },
        height: 550,
        showlegend: true,
        plot_bgcolor: bgColor,
        paper_bgcolor: bgColor,
        font: { color: textColor, family: 'Inter, sans-serif' },
      };

      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'] as const,
        toImageButtonOptions: {
          format: 'png',
          filename: 'forecast-chart',
          height: 550,
          width: 1200,
          scale: 2
        }
      };

      Plotly.default.newPlot(chartRef.current, traces, layout, config);
    });

    return () => {
      if (chartRef.current && typeof window !== 'undefined') {
        import('plotly.js-dist-min').then((Plotly) => {
          Plotly.default.purge(chartRef.current!);
        });
      }
    };
  }, [forecastData, historicalData, selectedCategory, darkMode]);

  const categories = Array.from(new Set(forecastData.map(d => d.category)));

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-4">
          <label className="mr-2 text-gray-700 dark:text-gray-300 font-medium">Category: </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Select category to forecast"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}
      <div ref={chartRef} className="w-full" style={{ height: '550px' }} />
    </div>
  );
};

export default ForecastChart;
