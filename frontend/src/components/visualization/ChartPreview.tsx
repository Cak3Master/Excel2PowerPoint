import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Bar, Line, Pie, Scatter } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import { ChartConfiguration, DataAnalysisResult } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface ChartPreviewProps {
  config: ChartConfiguration;
  analysisResult: DataAnalysisResult;
  loading?: boolean;
  error?: string;
}

export const ChartPreview: React.FC<ChartPreviewProps> = ({
  config,
  analysisResult,
  loading = false,
  error
}) => {
  const chartRef = useRef<any>(null);

  const generateChartData = () => {
    // Use sample data from analysis result preview
    const sampleData = analysisResult.preview.slice(0, 20); // Limit to 20 data points for preview
    
    const xColumn = config.data_mapping.x;
    const yColumn = config.data_mapping.y;
    const seriesColumn = config.data_mapping.series;

    if (!xColumn || !yColumn) {
      return { labels: [], datasets: [] };
    }

    // Extract labels (x-axis data)
    const labels = sampleData.map(row => {
      const value = row[xColumn];
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      return String(value);
    });

    // Prepare dataset(s)
    const datasets: any[] = [];

    if (seriesColumn) {
      // Group by series
      const groupedData: Record<string, any[]> = {};
      sampleData.forEach(row => {
        const series = String(row[seriesColumn]);
        if (!groupedData[series]) {
          groupedData[series] = [];
        }
        groupedData[series].push(row[yColumn]);
      });

      Object.entries(groupedData).forEach(([series, values], index) => {
        datasets.push({
          label: series,
          data: values,
          backgroundColor: config.styling?.colors?.[index % (config.styling.colors.length || 1)] || '#3B82F6',
          borderColor: config.styling?.colors?.[index % (config.styling.colors.length || 1)] || '#3B82F6',
          borderWidth: config.chart_type === 'line' ? 2 : 1,
          fill: config.chart_type === 'line' ? false : true,
        });
      });
    } else {
      // Single dataset
      const data = sampleData.map(row => row[yColumn]);
      datasets.push({
        label: yColumn,
        data,
        backgroundColor: config.styling?.colors || ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
        borderColor: config.styling?.colors?.[0] || '#3B82F6',
        borderWidth: config.chart_type === 'line' ? 2 : 1,
        fill: config.chart_type === 'line' ? false : true,
      });
    }

    return { labels, datasets };
  };

  const generateChartOptions = () => {
    const options: any = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: !!config.title,
          text: config.title,
          font: {
            size: (config.styling?.font_size || 12) + 4,
          },
        },
        legend: {
          display: true,
          position: 'top' as const,
          labels: {
            font: {
              size: config.styling?.font_size || 12,
            },
          },
        },
        tooltip: {
          enabled: config.interactivity?.hover !== false,
          titleFont: {
            size: config.styling?.font_size || 12,
          },
          bodyFont: {
            size: (config.styling?.font_size || 12) - 2,
          },
        },
      },
      scales: config.chart_type !== 'pie' ? {
        x: {
          title: {
            display: !!config.data_mapping.x,
            text: config.data_mapping.x,
            font: {
              size: config.styling?.font_size || 12,
            },
          },
          ticks: {
            font: {
              size: (config.styling?.font_size || 12) - 2,
            },
          },
        },
        y: {
          title: {
            display: !!config.data_mapping.y,
            text: config.data_mapping.y,
            font: {
              size: config.styling?.font_size || 12,
            },
          },
          ticks: {
            font: {
              size: (config.styling?.font_size || 12) - 2,
            },
          },
        },
      } : undefined,
      interaction: {
        intersect: false,
        mode: 'index' as const,
      },
      elements: {
        point: {
          radius: config.chart_type === 'line' ? 3 : 0,
          hoverRadius: config.chart_type === 'line' ? 5 : 0,
        },
      },
      onClick: config.interactivity?.click ? (event: any, elements: any[]) => {
        if (elements.length > 0) {
          console.log('Chart element clicked:', elements[0]);
        }
      } : undefined,
    };

    // Add zoom plugin if enabled
    if (config.interactivity?.zoom) {
      options.plugins.zoom = {
        zoom: {
          wheel: {
            enabled: true,
          },
          pinch: {
            enabled: true,
          },
          mode: 'xy' as const,
        },
        pan: {
          enabled: true,
          mode: 'xy' as const,
        },
      };
    }

    return options;
  };

  const renderChart = () => {
    const chartData = generateChartData();
    const chartOptions = generateChartOptions();

    const commonProps = {
      data: chartData,
      options: chartOptions,
      ref: chartRef,
    };

    switch (config.chart_type) {
      case 'bar':
      case 'stacked_bar':
        return <Bar {...commonProps} />;
      case 'line':
        return <Line {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'scatter':
        return <Scatter {...commonProps} />;
      default:
        return <Bar {...commonProps} />;
    }
  };

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg"
        style={{ 
          width: config.layout?.width || 800, 
          height: config.layout?.height || 600 
        }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Generating chart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="flex items-center justify-center bg-red-50 border border-red-200 rounded-lg"
        style={{ 
          width: config.layout?.width || 800, 
          height: config.layout?.height || 600 
        }}
      >
        <div className="text-center">
          <div className="text-red-400 mb-2">
            <svg className="mx-auto h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div 
        style={{ 
          width: config.layout?.width || 800, 
          height: config.layout?.height || 600 
        }}
        className="relative"
      >
        {renderChart()}
      </div>
      
      {/* Chart Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>Type: {config.chart_type}</span>
          <span>•</span>
          <span>Size: {config.layout?.width || 800}×{config.layout?.height || 600}</span>
          <span>•</span>
          <span>Theme: {config.styling?.theme || 'default'}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {config.interactivity?.hover && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Hover
            </span>
          )}
          {config.interactivity?.zoom && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Zoom
            </span>
          )}
          {config.interactivity?.click && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Click
            </span>
          )}
        </div>
      </div>
    </div>
  );
};