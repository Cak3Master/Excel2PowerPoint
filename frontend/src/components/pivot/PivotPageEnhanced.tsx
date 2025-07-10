import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  ArrowPathIcon, 
  LinkIcon,
  DocumentIcon,
  EyeIcon,
  BookmarkIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { DataSourceSelector } from './DataSourceSelector';
import { PivotTableManager } from './PivotTableManager';
import { ExcelFilePreview } from './ExcelFilePreview';
import { LabelManager } from '../labels/LabelManager';
import { useAppStore, useNotificationStore, usePivotStore } from '../../stores/appStore';
import { 
  DataSource, 
  DataRelationship, 
  PivotField, 
  PivotResult, 
  AgentResponse,
  PivotPreset,
  ExcelFilePreview as ExcelPreviewType,
  DataSourceLabel
} from '../../types';
import { 
  detectDataRelationships, 
  configurePivotTable, 
  generatePivotTable, 
  exportPivotTable,
  getPivotPresets,
  createPivotPreset,
  updatePivotPreset,
  generateExcelFromPreset
} from '../../services/api';

type ViewMode = 'data_sources' | 'pivot_tables' | 'excel_preview' | 'labels';

export const PivotPageEnhanced: React.FC = () => {
  const { dataSources, loading, setLoading } = useAppStore();
  const { addNotification } = useNotificationStore();
  const { 
    selectedSources,
    relationships,
    pivotHistory,
    currentPivotResult,
    currentPreset,
    pivotTables,
    setSelectedSources,
    setRelationships,
    addToPivotHistory,
    setCurrentPivotResult,
    setCurrentPreset,
    setPivotTables,
    cleanSelectedSources
  } = usePivotStore();
  
  // State
  const [detectingRelationships, setDetectingRelationships] = useState(false);
  const [presets, setPresets] = useState<PivotPreset[]>([]);
  const [excelPreview, setExcelPreview] = useState<ExcelPreviewType | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('data_sources');
  const [selectedLabel, setSelectedLabel] = useState<DataSourceLabel | null>(null);

  useEffect(() => {
    loadPresets();
  }, []);

  // Validate persisted state on component mount
  useEffect(() => {
    const validatePersistedState = () => {
      if (pivotTables.some(table => !table || !table.id)) {
        console.warn('Invalid pivot tables detected, filtering out invalid entries');
        const validTables = pivotTables.filter(table => table && table.id);
        setPivotTables(validTables);
      }
    };
    validatePersistedState();
  }, []);

  // Clean up selectedSources to only contain valid data source IDs
  useEffect(() => {
    if (dataSources.length > 0) {
      const validDataSourceIds = new Set(dataSources.map(ds => ds.id));
      cleanSelectedSources(validDataSourceIds);
    } else if (selectedSources.length > 0) {
      // No data sources available, clear selection
      console.warn('No data sources available, clearing selectedSources');
      setSelectedSources([]);
    }
  }, [dataSources, cleanSelectedSources, setSelectedSources]); // Use cleanSelectedSources to prevent infinite loops

  const loadPresets = async () => {
    try {
      const response = await getPivotPresets();
      if (response.success && response.data) {
        setPresets(response.data.presets);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handleSourceToggle = (sourceId: string) => {
    // Ensure we're working with valid data sources
    const validDataSourceIds = new Set(dataSources.map(ds => ds.id));
    
    if (!validDataSourceIds.has(sourceId)) {
      console.warn('Attempting to toggle invalid source ID:', sourceId);
      return;
    }
    
    // Clean current selection and toggle the source
    const cleanedSelectedSources = [...new Set(selectedSources.filter(id => validDataSourceIds.has(id)))];
    const newSources = cleanedSelectedSources.includes(sourceId) 
      ? cleanedSelectedSources.filter(id => id !== sourceId)
      : [...cleanedSelectedSources, sourceId];
    
    console.log('handleSourceToggle:', {
      sourceId,
      cleanedSelectedSources,
      newSources,
      validDataSourceIds: Array.from(validDataSourceIds)
    });
    
    setSelectedSources(newSources);
    
    // Clear relationships when sources change
    if (relationships.length > 0) {
      setRelationships([]);
    }
  };

  const handleDetectRelationships = async () => {
    if (selectedSources.length < 2) {
      addNotification({
        type: 'warning',
        title: 'Insufficient Data Sources',
        message: 'Select at least 2 data sources to detect relationships'
      });
      return;
    }

    setDetectingRelationships(true);
    try {
      const response = await detectDataRelationships({
        source_ids: selectedSources
      });

      if (response.success && response.data) {
        setRelationships(response.data.relationships || []);
        addNotification({
          type: 'success',
          title: 'Relationships Detected',
          message: `Found ${response.data.relationships?.length || 0} potential relationships`
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Detection Failed',
        message: 'Failed to detect relationships between data sources'
      });
    } finally {
      setDetectingRelationships(false);
    }
  };

  const handlePreviewGenerated = (preview: ExcelPreviewType) => {
    setExcelPreview(preview);
    setViewMode('excel_preview');
  };

  const handlePresetUpdate = async (preset: PivotPreset) => {
    try {
      const response = await updatePivotPreset(preset.id, preset);
      if (response.success && response.data) {
        setCurrentPreset(response.data);
        setPresets(prev => prev.map(p => p.id === preset.id ? response.data : p));
        addNotification({
          type: 'success',
          title: 'Preset Updated',
          message: 'Preset has been updated successfully'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update preset'
      });
    }
  };

  const handleCreatePreset = async (label: DataSourceLabel) => {
    try {
      const newPreset: Partial<PivotPreset> = {
        name: `${label.name} Preset`,
        description: `Auto-generated preset for ${label.name}`,
        label_id: label.id,
        pivot_tables: [],
        excel_structure: {
          sheets: [],
          layout: 'separate_sheets',
          include_raw_data: true,
          include_summary: true
        },
        tags: ['auto-generated'],
        is_public: false
      };

      const response = await createPivotPreset(newPreset);
      if (response.success && response.data) {
        setCurrentPreset(response.data);
        setPresets(prev => [...prev, response.data]);
        setViewMode('pivot_tables');
        addNotification({
          type: 'success',
          title: 'Preset Created',
          message: `Preset "${response.data.name}" has been created`
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Creation Failed',
        message: 'Failed to create preset'
      });
    }
  };

  const handleExportFile = async (format: 'excel' | 'powerpoint') => {
    if (!excelPreview) return;

    try {
      if (format === 'excel') {
        // Use the download URL from the preview metadata
        const downloadUrl = excelPreview.metadata.download_url;
        if (downloadUrl) {
          const link = document.createElement('a');
          link.href = `http://localhost:8000${downloadUrl}`;
          link.download = excelPreview.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          addNotification({
            type: 'success',
            title: 'Export Started',
            message: 'Excel file download has been initiated'
          });
        } else {
          throw new Error('Download URL not available');
        }
      } else {
        // For PowerPoint, we would need to implement the conversion
        // This would involve using the original convertToPptx functionality
        addNotification({
          type: 'info',
          title: 'PowerPoint Export',
          message: 'PowerPoint export functionality is coming soon'
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: `Failed to export ${format === 'excel' ? 'Excel' : 'PowerPoint'} file`
      });
    }
  };

  const ViewModeSelector = () => (
    <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => setViewMode('data_sources')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'data_sources'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Data Sources
      </button>
      <button
        onClick={() => setViewMode('pivot_tables')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'pivot_tables'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Pivot Tables
      </button>
      <button
        onClick={() => setViewMode('excel_preview')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'excel_preview'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
        disabled={!excelPreview}
      >
        Excel Preview
      </button>
      <button
        onClick={() => setViewMode('labels')}
        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
          viewMode === 'labels'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Labels
      </button>
    </div>
  );

  const PresetSelector = () => (
    <div className="flex items-center space-x-2">
      <BookmarkIcon className="h-5 w-5 text-gray-400" />
      <select
        value={currentPreset?.id || ''}
        onChange={(e) => {
          const preset = presets.find(p => p.id === e.target.value);
          setCurrentPreset(preset || null);
        }}
        className="text-sm border border-gray-300 rounded px-2 py-1"
      >
        <option value="">Select a preset...</option>
        {presets.map(preset => (
          <option key={preset.id} value={preset.id}>
            {preset.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Pivot Tables</h2>
          <p className="text-gray-600 mt-1">
            Create multiple pivot tables with intelligent presets and label management
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <PresetSelector />
          <ViewModeSelector />
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-gray-700">
                {selectedSources.length} data source{selectedSources.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-gray-700">
                {relationships.length} relationship{relationships.length !== 1 ? 's' : ''} detected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full" />
              <span className="text-gray-700">
                {currentPreset?.pivot_tables?.length || 0} pivot table{(currentPreset?.pivot_tables?.length || 0) !== 1 ? 's' : ''} configured
              </span>
            </div>
          </div>
          
          {currentPreset && (
            <div className="text-sm text-gray-500">
              Active preset: <span className="font-medium">{currentPreset.name}</span>
            </div>
          )}
        </div>
        
        {/* Debug Info for Development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div>
                <strong>Debug:</strong> selectedSources = [{selectedSources.join(', ')}]
              </div>
              <div>
                Available: [{dataSources.map(ds => ds.id).join(', ')}]
              </div>
            </div>
            {selectedSources.length !== new Set(selectedSources).size && (
              <div className="text-xs text-red-600 mt-1">
                ⚠️ Duplicates detected in selectedSources!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Configuration */}
        <div className="space-y-6">
          {viewMode === 'data_sources' && (
            <div className="space-y-4">
              {dataSources.length === 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No Data Sources</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Upload Excel files from the Data Upload tab to get started with pivot tables.
                  </p>
                  <button
                    onClick={() => setViewMode('labels')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create Labels for Your Data
                  </button>
                </div>
              )}
              
              {dataSources.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-md font-medium text-gray-900">Available Data Sources</h4>
                      <p className="text-sm text-gray-500">
                        Select sources and create labels to organize your data
                      </p>
                    </div>
                    <button
                      onClick={() => setViewMode('labels')}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <BookmarkIcon className="h-4 w-4 mr-2" />
                      Manage Labels
                    </button>
                  </div>
                  
                  <DataSourceSelector
                    dataSources={dataSources}
                    selectedSources={selectedSources}
                    relationships={relationships}
                    onSourceToggle={handleSourceToggle}
                    onDetectRelationships={handleDetectRelationships}
                    detectingRelationships={detectingRelationships}
                  />
                </>
              )}
            </div>
          )}

          {viewMode === 'pivot_tables' && (
            <div className="space-y-4">
              {selectedSources.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-yellow-900 mb-2">No Data Sources Selected</h4>
                  <p className="text-sm text-yellow-700">
                    Go to the Data Sources tab to select files before creating pivot tables. 
                    You can also create labels to organize your data structure.
                  </p>
                </div>
              )}
              
              {selectedSources.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Pivot Table Configuration</h4>
                  <p className="text-sm text-blue-700">
                    Create multiple pivot tables for your Excel file. Each table will be placed on a separate sheet.
                    Use the field search when configuring to quickly find the columns you need.
                  </p>
                </div>
              )}
              
              <PivotTableManager
                dataSources={dataSources}
                selectedSources={selectedSources}
                preset={currentPreset}
                onPresetUpdate={handlePresetUpdate}
                onPreviewGenerated={handlePreviewGenerated}
              />
            </div>
          )}

          {viewMode === 'labels' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">About Labels</h4>
                <p className="text-sm text-blue-700">
                  Labels help you categorize and reuse data structures. Create labels for recurring data types like 
                  "Monthly Sales", "Financial Reports", or "Inventory Data" to streamline your workflow.
                </p>
              </div>
              
              <LabelManager
                selectedLabelId={selectedLabel?.id}
                onLabelSelect={setSelectedLabel}
                onLabelCreated={(label) => handleCreatePreset(label)}
              />
            </div>
          )}
        </div>

        {/* Right Panel - Preview */}
        <div className="space-y-6">
          {viewMode === 'excel_preview' && excelPreview ? (
            <ExcelFilePreview
              excelPreview={excelPreview}
              onExport={handleExportFile}
            />
          ) : (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {viewMode === 'excel_preview' ? 'No Preview Available' : 'Excel Preview'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {viewMode === 'excel_preview' 
                  ? 'Generate a preview from your pivot tables to see the Excel structure'
                  : 'Preview will appear here when you generate from pivot tables'
                }
              </p>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => setViewMode('data_sources')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2"
              >
                <ChartBarIcon className="h-4 w-4" />
                <div>
                  <div>Select Data Sources</div>
                  <div className="text-xs text-gray-500">Choose uploaded files</div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('labels')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2"
              >
                <BookmarkIcon className="h-4 w-4" />
                <div>
                  <div>Manage Labels</div>
                  <div className="text-xs text-gray-500">Create & organize data types</div>
                </div>
              </button>
              <button
                onClick={() => setViewMode('pivot_tables')}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2"
              >
                <DocumentIcon className="h-4 w-4" />
                <div>
                  <div>Configure Pivot Tables</div>
                  <div className="text-xs text-gray-500">Create multiple pivots</div>
                </div>
              </button>
            </div>
          </div>
          
          {/* Workflow Guide */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">How to Use</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">1</span>
                <span>Upload Excel files in the Data Upload tab</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">2</span>
                <span>Create labels to categorize your data types</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">3</span>
                <span>Select data sources and create pivot tables</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center font-medium">4</span>
                <span>Generate and download your Excel file</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};