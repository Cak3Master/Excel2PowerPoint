import React, { useState, useEffect } from 'react';
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
import { useNotificationStore } from '../../stores/appStore';
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
  const [pivotTables, setPivotTables] = useState<PivotTableDefinition[]>(() => {
    try {
      const tables = preset?.pivot_tables || [];
      if (!Array.isArray(tables)) return [];
      return tables.filter(table => {
        try {
          return table && typeof table === 'object' && table.id;
        } catch {
          return false;
        }
      });
    } catch {
      return [];
    }
  });
  const [activePivotIndex, setActivePivotIndex] = useState<number | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [editingPivot, setEditingPivot] = useState<PivotTableDefinition | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);

  useEffect(() => {
    try {
      if (preset) {
        const tables = preset.pivot_tables || [];
        if (!Array.isArray(tables)) {
          setPivotTables([]);
          return;
        }
        const validTables = tables.filter(table => {
          try {
            return table && typeof table === 'object' && table.id;
          } catch {
            return false;
          }
        });
        setPivotTables(validTables);
      }
    } catch (error) {
      console.error('Error updating pivot tables from preset:', error);
      setPivotTables([]);
    }
  }, [preset]);

  const createNewPivotTable = () => {
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
    setPivotTables(updatedTables);
    setEditingPivot(newPivot);
    setActivePivotIndex(pivotTables.length);
    setIsConfiguring(true);
  };

  const editPivotTable = (index: number) => {
    setEditingPivot(pivotTables[index]);
    setActivePivotIndex(index);
    setIsConfiguring(true);
  };

  const deletePivotTable = (index: number) => {
    if (confirm('Are you sure you want to delete this pivot table?')) {
      const newPivotTables = (pivotTables || []).filter((table, i) => table && table.id && i !== index);
      setPivotTables(newPivotTables);
      
      if (activePivotIndex === index) {
        setActivePivotIndex(null);
        setIsConfiguring(false);
      }
      
      updatePreset(newPivotTables);
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
  };

  const savePivotConfiguration = (configuration: any) => {
    if (!editingPivot) return;

    const updatedPivot: PivotTableDefinition = {
      ...editingPivot,
      configuration: configuration
    };

    const newPivotTables = [...(pivotTables || [])];
    if (activePivotIndex !== null) {
      newPivotTables[activePivotIndex] = updatedPivot;
    } else {
      newPivotTables.push(updatedPivot);
    }

    const validTables = newPivotTables.filter(table => table && table.id);
    setPivotTables(validTables);
    setIsConfiguring(false);
    setEditingPivot(null);
    setActivePivotIndex(null);
    
    updatePreset(validTables);
  };

  const updatePreset = (newPivotTables: PivotTableDefinition[]) => {
    if (preset && onPresetUpdate) {
      const updatedPreset: PivotPreset = {
        ...preset,
        pivot_tables: newPivotTables,
        updated_at: new Date().toISOString()
      };
      onPresetUpdate(updatedPreset);
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
                setIsConfiguring(false);
                setEditingPivot(null);
                setActivePivotIndex(null);
              }}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => savePivotConfiguration(editingPivot.configuration)}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Configuration
            </button>
          </div>
        </div>

        <PivotConfiguration
          dataSources={dataSources}
          selectedSources={selectedSources}
          initialConfiguration={editingPivot.configuration}
          onConfigurationChange={savePivotConfiguration}
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
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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
                    className="p-1 text-gray-400 hover:text-blue-600 rounded"
                    title="Configure"
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
            Create your first pivot table to get started
          </p>
          <button
            onClick={createNewPivotTable}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
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