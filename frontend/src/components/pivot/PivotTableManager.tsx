import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PlusIcon, 
  DocumentIcon, 
  ChartBarIcon,
  PlayIcon,
  CogIcon,
  TrashIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import { PivotTableDefinition, DataSource, PivotPreset, ExcelFilePreview } from '../../types';
import { PivotConfiguration } from './PivotConfiguration';
import { useNotificationStore, usePivotStore } from '../../stores/appStore';
import { generateExcelFromPreset } from '../../services/api';

interface PivotTableManagerProps {
  dataSources: DataSource[];
  selectedSources: string[];
  onPreviewGenerated: (preview: ExcelFilePreview) => void;
  preset?: PivotPreset;
  onPresetUpdate?: (preset: PivotPreset) => void;
}

export const PivotTableManager: React.FC<PivotTableManagerProps> = ({
  dataSources,
  selectedSources,
  onPreviewGenerated,
  preset,
  onPresetUpdate
}) => {
  const { addNotification } = useNotificationStore();
  const { pivotTables, setPivotTables, currentPreset, setCurrentPreset } = usePivotStore();

  // Helper function to check prerequisites
  const checkPrerequisites = () => {
    if (!dataSources || dataSources.length === 0) {
      return { valid: false, reason: 'no-sources', message: 'No data sources available' };
    }
    if (!selectedSources || selectedSources.length === 0) {
      return { valid: false, reason: 'no-selection', message: 'No data sources selected' };
    }
    return { valid: true, reason: null, message: null };
  };
  
  // Initialize pivot tables from preset if not already loaded
  const [initialized, setInitialized] = useState(false);
  const [activePivotIndex, setActivePivotIndex] = useState<number | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [editingPivot, setEditingPivot] = useState<PivotTableDefinition | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [pendingConfiguration, setPendingConfiguration] = useState<any>(null);
  
  // Create stable callback reference with debouncing
  const stableConfigurationCallback = useCallback((config: any) => {
    // Only update if we actually have fields configured
    if ((config.rowFields?.length > 0) || (config.columnFields?.length > 0) || (config.valueFields?.length > 0)) {
      setPendingConfiguration({
        row_fields: config.rowFields,
        column_fields: config.columnFields,
        value_fields: config.valueFields
      });
    }
  }, []);

  // Initialize pivot tables from preset when component loads or preset changes
  useEffect(() => {
    try {
      if (!initialized) {
        // Always initialize from store first, then from preset
        if (pivotTables.length > 0) {
          // State already exists in store - don't overwrite it
          setInitialized(true);
        } else if (preset?.pivot_tables) {
          // Initialize from preset only if store is empty
          const tables = preset.pivot_tables || [];
          if (Array.isArray(tables)) {
            const validTables = tables.filter(table => {
              try {
                return table && typeof table === 'object' && table.id;
              } catch {
                return false;
              }
            });
            setPivotTables(validTables);
          }
          setCurrentPreset(preset);
          setInitialized(true);
        } else {
          // Empty initialization
          setPivotTables([]);
          setCurrentPreset(null);
          setInitialized(true);
        }
      } else if (preset && preset.id !== currentPreset?.id) {
        // Only update if preset actually changed
        const tables = preset.pivot_tables || [];
        if (Array.isArray(tables)) {
          const validTables = tables.filter(table => {
            try {
              return table && typeof table === 'object' && table.id;
            } catch {
              return false;
            }
          });
          setPivotTables(validTables);
        }
        setCurrentPreset(preset);
      }
    } catch (error) {
      console.error('Error updating pivot tables from preset:', error);
      if (!initialized) {
        setPivotTables([]);
        setCurrentPreset(null);
        setInitialized(true);
      }
    }
  }, [preset, initialized, currentPreset, pivotTables.length, setPivotTables, setCurrentPreset]);

  const createNewPivotTable = () => {
    // Validate prerequisites before creating new pivot table
    const prerequisites = checkPrerequisites();
    if (!prerequisites.valid) {
      addNotification({
        type: 'warning',
        title: prerequisites.reason === 'no-sources' ? 'No Data Sources Available' : 'No Data Sources Selected',
        message: prerequisites.reason === 'no-sources' 
          ? 'Please upload data sources before creating pivot tables'
          : 'Please select at least one data source to create a pivot table'
      });
      return;
    }

    const newPivot: PivotTableDefinition = {
      id: `pivot_${Date.now()}`,
      name: `Pivot Table ${pivotTables.length + 1}`,
      description: '',
      configuration: {
        row_fields: [],
        column_fields: [],
        value_fields: []
      },
      sheet_name: `PivotSheet${pivotTables.length + 1}`,
      position: {
        row: 1,
        column: 1
      },
      created_at: new Date().toISOString()
    };

    const updatedTables = [...(pivotTables || []), newPivot].filter(table => table && table.id);
    updatePreset(updatedTables);
    setEditingPivot(newPivot);
    setActivePivotIndex(pivotTables.length);
    setIsConfiguring(true);

    // Show success feedback
    addNotification({
      type: 'success',
      title: 'Pivot Table Created',
      message: `Created new pivot table: ${newPivot.name}`
    });
  };

  const editPivotTable = (index: number) => {
    console.log('Editing pivot table:', index, pivotTables[index]);
    
    // Validate prerequisites before opening configuration
    const prerequisites = checkPrerequisites();
    if (!prerequisites.valid) {
      addNotification({
        type: 'warning',
        title: prerequisites.reason === 'no-sources' ? 'No Data Sources Available' : 'No Data Sources Selected',
        message: prerequisites.reason === 'no-sources' 
          ? 'Please upload data sources before configuring pivot tables'
          : 'Please select at least one data source to configure this pivot table'
      });
      return;
    }

    // Show success feedback when opening configuration
    addNotification({
      type: 'info',
      title: 'Configuration Opened',
      message: `Configuring pivot table: ${pivotTables[index].name}`
    });

    setEditingPivot(pivotTables[index]);
    setActivePivotIndex(index);
    setIsConfiguring(true);
  };

  const deletePivotTable = (index: number) => {
    const pivotToDelete = pivotTables[index];
    if (confirm('Are you sure you want to delete this pivot table?')) {
      const newPivotTables = (pivotTables || []).filter((table, i) => table && table.id && i !== index);
      setPivotTables(newPivotTables);
      
      if (activePivotIndex === index) {
        setActivePivotIndex(null);
        setIsConfiguring(false);
      }
      
      updatePreset(newPivotTables);

      // Show success feedback
      addNotification({
        type: 'success',
        title: 'Pivot Table Deleted',
        message: `Deleted pivot table: ${pivotToDelete.name}`
      });
    }
  };

  const duplicatePivotTable = (index: number) => {
    const originalPivot = pivotTables[index];
    const duplicatedPivot: PivotTableDefinition = {
      ...originalPivot,
      id: `pivot_${Date.now()}`,
      name: `${originalPivot.name} (Copy)`,
      sheet_name: `${originalPivot.sheet_name}_Copy`,
      created_at: new Date().toISOString()
    };

    const updatedTables = [...(pivotTables || []), duplicatedPivot].filter(table => table && table.id);
    setPivotTables(updatedTables);
    updatePreset(updatedTables);

    // Show success feedback
    addNotification({
      type: 'success',
      title: 'Pivot Table Duplicated',
      message: `Created copy: ${duplicatedPivot.name}`
    });
  };

  const savePivotConfiguration = (configuration: any) => {
    console.log('savePivotConfiguration called with:', configuration);
    console.log('editingPivot:', editingPivot);
    console.log('activePivotIndex:', activePivotIndex);
    
    if (!editingPivot) {
      console.warn('No editing pivot found, returning');
      return;
    }

    // Handle configuration structure from PivotConfiguration component
    let finalConfiguration;
    if (configuration.rowFields && configuration.columnFields && configuration.valueFields) {
      // Configuration from PivotConfiguration component
      console.log('Using rowFields/columnFields/valueFields structure');
      finalConfiguration = {
        row_fields: configuration.rowFields,
        column_fields: configuration.columnFields,
        value_fields: configuration.valueFields
      };
    } else {
      // Direct configuration object
      console.log('Using direct configuration structure');
      finalConfiguration = configuration;
    }

    console.log('Final configuration:', finalConfiguration);

    const updatedPivot: PivotTableDefinition = {
      ...editingPivot,
      configuration: finalConfiguration
    };

    console.log('Updated pivot:', updatedPivot);

    const newPivotTables = [...(pivotTables || [])];
    if (activePivotIndex !== null) {
      newPivotTables[activePivotIndex] = updatedPivot;
      console.log('Updated existing pivot at index:', activePivotIndex);
    } else {
      newPivotTables.push(updatedPivot);
      console.log('Added new pivot');
    }

    const validTables = newPivotTables.filter(table => table && table.id);
    console.log('Valid tables after update:', validTables);
    
    setPivotTables(validTables);
    setIsConfiguring(false);
    setEditingPivot(null);
    setActivePivotIndex(null);
    setPendingConfiguration(null);
    
    updatePreset(validTables);

    // Show success feedback
    addNotification({
      type: 'success',
      title: 'Configuration Saved',
      message: `Pivot table configuration saved successfully`
    });
  };

  const updatePreset = (newPivotTables: PivotTableDefinition[]) => {
    // Update global store first
    setPivotTables(newPivotTables);
    
    // Update preset if available
    if (preset && onPresetUpdate) {
      const updatedPreset: PivotPreset = {
        ...preset,
        pivot_tables: newPivotTables,
        updated_at: new Date().toISOString()
      };
      setCurrentPreset(updatedPreset);
      onPresetUpdate(updatedPreset);
    } else if (currentPreset) {
      // Update current preset in store even if no callback
      const updatedPreset = {
        ...currentPreset,
        pivot_tables: newPivotTables,
        updated_at: new Date().toISOString()
      };
      setCurrentPreset(updatedPreset);
    }
  };

  const generateExcelPreview = async () => {
    if (!preset) {
      addNotification({
        type: 'error',
        title: 'No Preset Selected',
        message: 'Please select or create a preset first'
      });
      return;
    }

    setGeneratingPreview(true);
    try {
      const response = await generateExcelFromPreset(preset.id, selectedSources);
      
      if (response.success && response.data) {
        onPreviewGenerated(response.data);
        addNotification({
          type: 'success',
          title: 'Excel Preview Generated',
          message: `Preview created with ${response.data.sheets.length} sheets`
        });
      } else {
        throw new Error(response.error || 'Failed to generate preview');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Preview Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setGeneratingPreview(false);
    }
  };

  const hasConfiguration = (pivot: any) => {
    try {
      // Extremely defensive approach
      if (!pivot) return false;
      if (typeof pivot !== 'object') return false;
      if (!pivot.configuration) return false;
      if (typeof pivot.configuration !== 'object') return false;
      
      const config = pivot.configuration;
      const rowFields = Array.isArray(config.row_fields) ? config.row_fields : [];
      const columnFields = Array.isArray(config.column_fields) ? config.column_fields : [];
      const valueFields = Array.isArray(config.value_fields) ? config.value_fields : [];
      
      return rowFields.length > 0 || columnFields.length > 0 || valueFields.length > 0;
    } catch (error) {
      console.error('Error in hasConfiguration:', error, pivot);
      return false;
    }
  };

  if (isConfiguring && editingPivot) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Configure: {editingPivot.name}
            </h3>
            <p className="text-sm text-gray-500">
              Sheet: {editingPivot.sheet_name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                console.log('Canceling pivot configuration');
                setIsConfiguring(false);
                setEditingPivot(null);
                setActivePivotIndex(null);
                setPendingConfiguration(null);
              }}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const configToSave = pendingConfiguration || editingPivot.configuration;
                console.log('Saving pivot configuration:', configToSave);
                savePivotConfiguration(configToSave);
              }}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              disabled={!pendingConfiguration && (!editingPivot.configuration?.row_fields?.length && 
                       !editingPivot.configuration?.column_fields?.length && 
                       !editingPivot.configuration?.value_fields?.length)}
            >
              Save Configuration
            </button>
          </div>
        </div>

        <PivotConfiguration
          dataSources={dataSources}
          selectedSources={selectedSources}
          initialConfiguration={editingPivot.configuration}
          onConfigurationChange={stableConfigurationCallback}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Pivot Tables</h3>
          <p className="text-sm text-gray-500">
            Create multiple pivot tables for your Excel file
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={createNewPivotTable}
            disabled={!checkPrerequisites().valid}
            className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md ${
              !checkPrerequisites().valid
                ? 'text-gray-400 bg-gray-300 cursor-not-allowed'
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
            title={
              checkPrerequisites().valid
                ? 'Create a new pivot table'
                : checkPrerequisites().reason === 'no-sources'
                ? 'No data sources available - please upload data first'
                : 'No data sources selected - please select data sources first'
            }
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Pivot Table
          </button>
          
          {pivotTables.length > 0 && (
            <button
              onClick={generateExcelPreview}
              disabled={generatingPreview || selectedSources.length === 0}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingPreview ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Generate Preview
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Pivot Tables Grid */}
      {Array.isArray(pivotTables) && pivotTables.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {pivotTables.filter(pivot => {
            try {
              // Extremely defensive filtering
              if (!pivot) {
                console.warn('Found null/undefined pivot table entry');
                return false;
              }
              if (typeof pivot !== 'object') {
                console.warn('Found non-object pivot table entry:', typeof pivot);
                return false;
              }
              if (!pivot.id) {
                console.warn('Found pivot table without ID:', pivot);
                return false;
              }
              return true;
            } catch (error) {
              console.error('Error filtering pivot table:', error, pivot);
              return false;
            }
          }).map((pivot, index) => {
            try {
              return (
            <div
              key={pivot.id}
              className="relative p-4 border border-gray-200 rounded-lg bg-white hover:shadow-md transition-shadow"
            >
              {/* Status Indicator */}
              <div className="absolute top-3 right-3">
                <div className={`w-3 h-3 rounded-full ${
                  hasConfiguration(pivot) ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
              </div>

              {/* Pivot Table Info */}
              <div className="pr-8">
                <h4 className="font-medium text-gray-900 truncate">
                  {pivot.name}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  Sheet: {pivot.sheet_name}
                </p>
                
                {/* Configuration Summary */}
                <div className="mt-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      Rows: {pivot.configuration?.row_fields?.length || 0}
                    </span>
                    <span>
                      Columns: {pivot.configuration?.column_fields?.length || 0}
                    </span>
                    <span>
                      Values: {pivot.configuration?.value_fields?.length || 0}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    hasConfiguration(pivot) 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {hasConfiguration(pivot) ? 'Configured' : 'Needs Configuration'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => editPivotTable(index)}
                    disabled={!checkPrerequisites().valid}
                    className={`p-1 rounded transition-colors ${
                      !checkPrerequisites().valid
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-400 hover:text-blue-600'
                    }`}
                    title={
                      checkPrerequisites().valid
                        ? `Configure ${pivot.name}`
                        : checkPrerequisites().reason === 'no-sources'
                        ? 'No data sources available'
                        : 'No data sources selected'
                    }
                  >
                    <CogIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => duplicatePivotTable(index)}
                    className="p-1 text-gray-400 hover:text-green-600 rounded"
                    title="Duplicate"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deletePivotTable(index)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
              );
            } catch (error) {
              console.error('Error rendering pivot table:', error, pivot);
              return null;
            }
          })}
        </div>
      ) : (
        <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pivot tables</h3>
          <p className="mt-1 text-sm text-gray-500">
            {checkPrerequisites().valid
              ? 'Create your first pivot table to get started'
              : checkPrerequisites().reason === 'no-sources'
              ? 'Upload data sources first, then create your pivot tables'
              : 'Select data sources first, then create your pivot tables'
            }
          </p>
          <button
            onClick={createNewPivotTable}
            disabled={!checkPrerequisites().valid}
            className={`mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md ${
              !checkPrerequisites().valid
                ? 'text-gray-400 bg-gray-300 cursor-not-allowed'
                : 'text-white bg-blue-600 hover:bg-blue-700'
            }`}
            title={
              checkPrerequisites().valid
                ? 'Create your first pivot table'
                : checkPrerequisites().reason === 'no-sources'
                ? 'No data sources available - please upload data first'
                : 'No data sources selected - please select data sources first'
            }
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Create Pivot Table
          </button>
        </div>
      )}

      {/* Quick Stats */}
      {pivotTables.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {pivotTables.length} pivot table{pivotTables.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <DocumentIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">
                  {new Set(pivotTables.map(p => p.sheet_name)).size} sheet{new Set(pivotTables.map(p => p.sheet_name)).size !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600">
                  {pivotTables.filter(hasConfiguration).length} configured
                </span>
              </div>
            </div>
            
            <div className="text-xs text-gray-500">
              {selectedSources.length} data source{selectedSources.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        </div>
      )}
    </div>
  );
};