import React, { useState, useEffect } from 'react';
import { TableCellsIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAppStore, useNotificationStore, usePivotStore } from '../../stores/appStore';
import { 
  detectDataRelationships,
  configurePivotTable,
  generatePivotTable,
  exportPivotTable
} from '../../services/api';
import { 
  DataRelationship, 
  PivotField, 
  PivotResult,
  AgentResponse 
} from '../../types';
import { DataSourceSelector } from './DataSourceSelector';
import { PivotConfiguration } from './PivotConfiguration';
import { PivotPreview } from './PivotPreview';

export const PivotPage: React.FC = () => {
  const { dataSources, loading, setLoading, setError } = useAppStore();
  const { addNotification } = useNotificationStore();
  const { 
    selectedSources, 
    relationships, 
    pivotConfiguration,
    pivotResult,
    setSelectedSources,
    setRelationships,
    setPivotConfiguration,
    setPivotResult
  } = usePivotStore();
  
  const [step, setStep] = useState<'select' | 'configure' | 'preview'>('select');
  const [detectingRelationships, setDetectingRelationships] = useState(false);
  const [generatingPivot, setGeneratingPivot] = useState(false);
  const [pivotId, setPivotId] = useState<string | null>(null);

  useEffect(() => {
    if (selectedSources.length > 0 && pivotConfiguration) {
      setStep('configure');
    } else if (selectedSources.length > 0) {
      setStep('select');
    }
  }, [selectedSources, pivotConfiguration]);

  const handleSourceToggle = (sourceId: string) => {
    const newSources = selectedSources.includes(sourceId)
      ? selectedSources.filter(id => id !== sourceId)
      : [...selectedSources, sourceId];
    
    setSelectedSources(newSources);
    
    // Clear relationships when sources change
    if (relationships.length > 0) {
      setRelationships([]);
    }
    
    // Reset pivot data
    setPivotResult(null);
    setPivotId(null);
  };

  const handleDetectRelationships = async () => {
    if (selectedSources.length < 2) return;

    setDetectingRelationships(true);
    try {
      const response: AgentResponse<{
        relationships: DataRelationship[];
        suggestions: string[];
      }> = await detectDataRelationships({
        source_ids: selectedSources
      });

      if (response.success && response.data) {
        setRelationships(response.data.relationships);
        
        addNotification({
          type: 'success',
          title: 'Relationships Detected',
          message: `Found ${response.data.relationships.length} potential relationships between data sources`
        });
      } else {
        throw new Error(response.error || 'Failed to detect relationships');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to detect relationships';
      addNotification({
        type: 'error',
        title: 'Detection Failed',
        message: errorMessage
      });
    } finally {
      setDetectingRelationships(false);
    }
  };

  const handleConfigurationChange = async (config: {
    rowFields: PivotField[];
    columnFields: PivotField[];
    valueFields: PivotField[];
  }) => {
    setPivotConfiguration(config as any);

    // Auto-configure the pivot table when configuration changes
    if (config.rowFields.length > 0 || config.columnFields.length > 0 || config.valueFields.length > 0) {
      try {
        const response: AgentResponse<{
          config_id: string;
          preview_data: PivotResult;
        }> = await configurePivotTable({
          source_ids: selectedSources,
          row_fields: config.rowFields,
          column_fields: config.columnFields,
          value_fields: config.valueFields,
          relationships: relationships
        });

        if (response.success && response.data) {
          setPivotId(response.data.config_id);
          
          // Set the preview data immediately from the configuration response
          if (response.data.preview_data) {
            setPivotResult(response.data.preview_data);
            
            addNotification({
              type: 'success',
              title: 'Pivot Table Configured',
              message: `Generated preview with ${response.data.preview_data.data.length} rows`
            });
          }
        }
      } catch (error) {
        console.error('Failed to configure pivot table:', error);
        addNotification({
          type: 'error',
          title: 'Configuration Failed',
          message: error instanceof Error ? error.message : 'Failed to configure pivot table'
        });
      }
    } else {
      // Clear preview when no configuration is selected
      setPivotResult(null);
    }
  };

  const generatePivotPreview = async (configId?: string) => {
    const id = configId || pivotId;
    if (!id) return;

    setGeneratingPivot(true);
    try {
      const response: AgentResponse<PivotResult> = await generatePivotTable(id);

      if (response.success && response.data) {
        setPivotResult(response.data);
        setStep('preview');
        
        addNotification({
          type: 'success',
          title: 'Pivot Table Generated',
          message: `Created pivot table with ${response.data.data ? response.data.data.length : response.data.rows?.length || 0} rows`
        });
      } else {
        throw new Error(response.error || 'Failed to generate pivot table');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate pivot table';
      addNotification({
        type: 'error',
        title: 'Generation Failed',
        message: errorMessage
      });
    } finally {
      setGeneratingPivot(false);
    }
  };

  const handleExport = async (format: 'excel' | 'powerpoint') => {
    if (!pivotId) return;

    try {
      const response = await exportPivotTable(pivotId, format);
      
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
          title: 'Export Complete',
          message: `Downloaded ${response.data.filename}`
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to export pivot table'
      });
    }
  };

  const resetToSelection = () => {
    setStep('select');
    setPivotConfiguration(null);
    setPivotResult(null);
    setPivotId(null);
  };

  if (dataSources.length === 0) {
    return (
      <div className="text-center py-12">
        <TableCellsIcon className="mx-auto h-12 w-12 text-gray-300" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data sources</h3>
        <p className="mt-1 text-sm text-gray-500">
          Upload data sources to start creating pivot tables.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Pivot Tables</h2>
          <p className="text-sm text-gray-500 mt-1">
            Combine and analyze data from multiple sources
          </p>
        </div>
        
        {/* Step Navigation */}
        <div className="flex items-center space-x-2">
          {step !== 'select' && (
            <button
              onClick={resetToSelection}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Selection
            </button>
          )}
          
          {step === 'configure' && pivotConfiguration && (
            <button
              onClick={() => generatePivotPreview()}
              disabled={generatingPivot}
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {generatingPivot ? 'Generating...' : 'Generate Preview'}
            </button>
          )}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center space-x-4">
        <div className={`flex items-center ${step === 'select' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center text-sm font-medium ${step === 'select' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
            1
          </div>
          <span className="ml-2 text-sm font-medium">Select Data</span>
        </div>
        
        <div className={`h-px flex-1 ${selectedSources.length > 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        
        <div className={`flex items-center ${step === 'configure' ? 'text-blue-600' : selectedSources.length > 0 ? 'text-gray-600' : 'text-gray-400'}`}>
          <div className={`flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center text-sm font-medium ${step === 'configure' ? 'border-blue-600 bg-blue-600 text-white' : selectedSources.length > 0 ? 'border-gray-600' : 'border-gray-300'}`}>
            2
          </div>
          <span className="ml-2 text-sm font-medium">Configure</span>
        </div>
        
        <div className={`h-px flex-1 ${step === 'preview' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
        
        <div className={`flex items-center ${step === 'preview' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`flex-shrink-0 w-8 h-8 border-2 rounded-full flex items-center justify-center text-sm font-medium ${step === 'preview' ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'}`}>
            3
          </div>
          <span className="ml-2 text-sm font-medium">Preview</span>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Data Source Selection */}
          <DataSourceSelector
            dataSources={dataSources}
            selectedSources={selectedSources}
            relationships={relationships}
            onSourceToggle={handleSourceToggle}
            onDetectRelationships={handleDetectRelationships}
            detectingRelationships={detectingRelationships}
          />

          {/* Step 2: Configuration */}
          {selectedSources.length > 0 && (
            <PivotConfiguration
              dataSources={dataSources}
              selectedSources={selectedSources}
              onConfigurationChange={handleConfigurationChange}
            />
          )}
        </div>

        {/* Sidebar: Preview */}
        <div className="space-y-6">
          <PivotPreview
            pivotData={pivotResult}
            configuration={pivotConfiguration as any || { rowFields: [], columnFields: [], valueFields: [] }}
            loading={generatingPivot}
            error={undefined}
            onRefresh={() => generatePivotPreview()}
            onExport={handleExport}
          />
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </div>
  );
};