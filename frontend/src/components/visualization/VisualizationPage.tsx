import React, { useState, useEffect } from 'react';
import { ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppStore, useNotificationStore } from '../../stores/appStore';
import { 
  analyzeDataForVisualization,
  configureVisualization,
  previewChart,
  exportChart
} from '../../services/api';
import { 
  ChartRecommendation, 
  ChartConfiguration as ChartConfig,
  DataAnalysisResult,
  AgentResponse 
} from '../../types';
import { ChartRecommendations } from './ChartRecommendations';
import { ChartConfiguration } from './ChartConfiguration';
import { ChartPreview } from './ChartPreview';

export const VisualizationPage: React.FC = () => {
  const { dataSources, activeDataSource, loading, setLoading, setError } = useAppStore();
  const { addNotification } = useNotificationStore();
  
  const [step, setStep] = useState<'select' | 'analyze' | 'configure' | 'preview'>('select');
  const [analysisResult, setAnalysisResult] = useState<DataAnalysisResult | null>(null);
  const [recommendations, setRecommendations] = useState<ChartRecommendation[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<ChartRecommendation | null>(null);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);
  const [chartId, setChartId] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string>('');

  const activeData = dataSources.find(ds => ds.id === activeDataSource);

  useEffect(() => {
    if (activeDataSource && step === 'select') {
      analyzeData();
    }
  }, [activeDataSource]);

  const analyzeData = async () => {
    if (!activeDataSource) return;

    setLoading(true);
    setError(undefined);
    
    try {
      const response: AgentResponse<{
        analysis: DataAnalysisResult;
        recommendations: ChartRecommendation[];
      }> = await analyzeDataForVisualization(activeDataSource);
      
      if (response.success && response.data) {
        setAnalysisResult(response.data.analysis);
        setRecommendations(response.data.recommendations);
        setStep('analyze');
        
        addNotification({
          type: 'success',
          title: 'Data Analysis Complete',
          message: `Found ${response.data.recommendations.length} chart recommendations`
        });
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze data';
      setError(errorMessage);
      addNotification({
        type: 'error',
        title: 'Analysis Failed',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationSelect = async (recommendation: ChartRecommendation) => {
    setSelectedRecommendation(recommendation);
    setStep('configure');
  };

  const handleConfigurationChange = async (config: ChartConfig) => {
    setChartConfig(config);
    
    // Auto-configure the chart
    if (config && activeDataSource) {
      try {
        const response: AgentResponse<{
          config_id: string;
          chart_config: any;
        }> = await configureVisualization({
          ...config,
          data_source_id: activeDataSource
        });
        
        if (response.success && response.data) {
          setChartId(response.data.config_id);
        }
      } catch (error) {
        console.error('Failed to configure chart:', error);
      }
    }
  };

  const handlePreview = async () => {
    if (!chartId) return;
    
    setStep('preview');
    setPreviewError('');
    
    try {
      const response = await previewChart(chartId, 'json');
      if (!response.success) {
        setPreviewError(response.error || 'Preview failed');
      }
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Preview failed');
    }
  };

  const handleExport = async () => {
    if (!chartId) return;
    
    try {
      const response = await exportChart(chartId, 'png');
      if (response.success && response.data) {
        // Trigger download
        const link = document.createElement('a');
        link.href = response.data.download_url;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addNotification({
          type: 'success',
          title: 'Chart Exported',
          message: `Downloaded ${response.data.filename}`
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export chart'
      });
    }
  };

  const resetToAnalysis = () => {
    setStep('analyze');
    setSelectedRecommendation(null);
    setChartConfig(null);
    setChartId(null);
    setPreviewError('');
  };

  if (dataSources.length === 0) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data sources</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload data sources to start creating visualizations.
        </p>
      </div>
    );
  }

  if (!activeDataSource) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Select a data source</h3>
          <p className="mt-1 text-sm text-gray-500">
            Choose a data source to analyze and create visualizations.
          </p>
        </div>
        
        {/* Data Source Selection */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {dataSources.map((dataSource) => (
            <button
              key={dataSource.id}
              onClick={() => {
                useAppStore.getState().setActiveDataSource(dataSource.id);
                setStep('select');
              }}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <h4 className="font-medium text-gray-900">{dataSource.name}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {dataSource.metadata.row_count.toLocaleString()} rows × {dataSource.metadata.column_count} columns
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {dataSource.type.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Visualization</h2>
          <p className="text-sm text-gray-500 mt-1">
            Analyzing: <span className="font-medium">{activeData?.name}</span>
          </p>
        </div>
        
        {/* Step Navigation */}
        <div className="flex items-center space-x-2">
          {step !== 'analyze' && (
            <button
              onClick={resetToAnalysis}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Analysis
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Analyzing data patterns...</p>
          </div>
        </div>
      )}

      {/* Analysis Step */}
      {step === 'analyze' && analysisResult && !loading && (
        <ChartRecommendations
          analysisResult={analysisResult}
          recommendations={recommendations}
          onRecommendationSelect={handleRecommendationSelect}
        />
      )}

      {/* Configuration Step */}
      {step === 'configure' && selectedRecommendation && analysisResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartConfiguration
            recommendation={selectedRecommendation}
            analysisResult={analysisResult}
            onConfigurationChange={handleConfigurationChange}
            onPreview={handlePreview}
            onExport={handleExport}
          />
          
          {chartConfig && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Live Preview</h3>
              <ChartPreview
                config={chartConfig}
                analysisResult={analysisResult}
                error={previewError}
              />
            </div>
          )}
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && chartConfig && analysisResult && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Chart Preview</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setStep('configure')}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Edit Configuration
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Export Chart
              </button>
            </div>
          </div>
          
          <ChartPreview
            config={chartConfig}
            analysisResult={analysisResult}
            error={previewError}
          />
        </div>
      )}

      {/* Error State */}
      {step === 'select' && !loading && !analysisResult && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Analysis in progress</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  We're analyzing your data to generate chart recommendations. This may take a moment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};