import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  PresentationChartLineIcon,
  ChartPieIcon,
  Squares2X2Icon,
  StarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { ChartRecommendation, DataAnalysisResult } from '../../types';

interface ChartRecommendationsProps {
  analysisResult: DataAnalysisResult;
  recommendations: ChartRecommendation[];
  onRecommendationSelect: (recommendation: ChartRecommendation) => void;
  loading?: boolean;
}

export const ChartRecommendations: React.FC<ChartRecommendationsProps> = ({
  analysisResult,
  recommendations,
  onRecommendationSelect,
  loading = false
}) => {
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);

  const getChartIcon = (chartType: string) => {
    const icons = {
      'bar': ChartBarIcon,
      'line': PresentationChartLineIcon,
      'pie': ChartPieIcon,
      'scatter': Squares2X2Icon,
      'heatmap': Squares2X2Icon,
      'stacked_bar': ChartBarIcon
    };
    const IconComponent = icons[chartType as keyof typeof icons] || ChartBarIcon;
    return <IconComponent className="h-6 w-6" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const handleRecommendationClick = (recommendation: ChartRecommendation) => {
    setSelectedRecommendation(recommendation.chart_type);
    onRecommendationSelect(recommendation);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Analyzing data patterns...</span>
        </div>
        
        {/* Loading skeleton */}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="animate-pulse flex space-x-4">
                <div className="rounded-full bg-gray-300 h-10 w-10"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Data Analysis Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-3">Data Analysis Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-blue-700 font-medium">Rows:</span>
            <span className="ml-2 text-blue-600">{analysisResult.row_count.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Columns:</span>
            <span className="ml-2 text-blue-600">{analysisResult.column_count}</span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Numeric:</span>
            <span className="ml-2 text-blue-600">
              {analysisResult.columns.filter(c => c.type.includes('int') || c.type.includes('float')).length}
            </span>
          </div>
          <div>
            <span className="text-blue-700 font-medium">Missing:</span>
            <span className="ml-2 text-blue-600">
              {analysisResult.data_patterns.missing_data_percentage.toFixed(1)}%
            </span>
          </div>
        </div>
        
        {/* Data Patterns */}
        <div className="mt-3 flex flex-wrap gap-2">
          {analysisResult.data_patterns.has_time_series && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Time Series Data
            </span>
          )}
          {analysisResult.data_patterns.has_numeric_data && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Numeric Data
            </span>
          )}
          {analysisResult.data_patterns.has_categorical_data && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Categorical Data
            </span>
          )}
        </div>
      </div>

      {/* Chart Recommendations */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <StarIcon className="h-5 w-5 text-yellow-500 mr-2" />
          Recommended Visualizations
        </h3>
        
        {recommendations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2">No chart recommendations available</p>
            <p className="text-sm">Try uploading data with numeric columns</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.map((recommendation, index) => (
              <div
                key={`${recommendation.chart_type}-${index}`}
                className={`
                  p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
                  ${selectedRecommendation === recommendation.chart_type
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
                onClick={() => handleRecommendationClick(recommendation)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`
                    p-2 rounded-lg
                    ${selectedRecommendation === recommendation.chart_type
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    {getChartIcon(recommendation.chart_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {recommendation.title}
                      </h4>
                      <span className={`
                        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${getConfidenceColor(recommendation.confidence)}
                      `}>
                        {Math.round(recommendation.confidence * 100)}%
                      </span>
                    </div>
                    
                    <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                      {recommendation.description}
                    </p>
                    
                    {/* Data Mapping Preview */}
                    <div className="mt-2 space-y-1">
                      {recommendation.data_mapping.x && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">X-axis:</span> {recommendation.data_mapping.x}
                        </div>
                      )}
                      {recommendation.data_mapping.y && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Y-axis:</span> {recommendation.data_mapping.y}
                        </div>
                      )}
                      {recommendation.data_mapping.series && (
                        <div className="text-xs text-gray-600">
                          <span className="font-medium">Series:</span> {recommendation.data_mapping.series}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedRecommendation === recommendation.chart_type && (
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <button className="flex items-center text-sm text-blue-600 hover:text-blue-700">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Create Chart
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Column Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Available Columns</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {analysisResult.columns.map((column) => (
            <div
              key={column.name}
              className="flex items-center space-x-2 p-2 bg-white rounded border text-xs"
            >
              <div className={`
                w-3 h-3 rounded-full
                ${column.type.includes('int') || column.type.includes('float')
                  ? 'bg-green-400'
                  : column.type.includes('datetime')
                    ? 'bg-purple-400'
                    : 'bg-gray-400'
                }
              `} />
              <span className="truncate font-medium">{column.name}</span>
              <span className="text-gray-500">({column.type})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};