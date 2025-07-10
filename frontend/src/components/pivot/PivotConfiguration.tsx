import React, { useState, useMemo, useRef } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { PivotField, DataSource, PivotPreset, PivotTableDefinition } from '../../types';
import { createPivotPreset } from '../../services/api';

interface PivotConfigurationProps {
  dataSources: DataSource[];
  selectedSources: string[];
  initialConfiguration?: {
    row_fields?: PivotField[];
    column_fields?: PivotField[];
    value_fields?: PivotField[];
  };
  onConfigurationChange: (config: {
    rowFields: PivotField[];
    columnFields: PivotField[];
    valueFields: PivotField[];
  }) => void;
}

export const PivotConfiguration: React.FC<PivotConfigurationProps> = ({
  dataSources,
  selectedSources,
  initialConfiguration,
  onConfigurationChange
}) => {
  const [rowFields, setRowFields] = useState<PivotField[]>([]);
  const [columnFields, setColumnFields] = useState<PivotField[]>([]);
  const [valueFields, setValueFields] = useState<PivotField[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState<'all' | 'text' | 'number'>('all');
  const [presets, setPresets] = useState<PivotPreset[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Safe data processing with comprehensive validation
  const availableColumns = useMemo(() => {
    if (!Array.isArray(dataSources) || dataSources.length === 0) return [];
    if (!Array.isArray(selectedSources) || selectedSources.length === 0) return [];
    
    const validDataSourceIds = new Set(
      dataSources.map(ds => ds?.id).filter(id => typeof id === 'string' && id.length > 0)
    );
    
    const cleanSelectedSources = selectedSources
      .filter(id => typeof id === 'string' && id.length > 0 && validDataSourceIds.has(id))
      .filter((id, index, arr) => arr.indexOf(id) === index);
    
    const columns: Array<{
      sourceId: string;
      sourceName: string;
      columnName: string;
    }> = [];
    
    for (const sourceId of cleanSelectedSources) {
      const source = dataSources.find(ds => ds.id === sourceId);
      if (!source?.metadata?.columns || !Array.isArray(source.metadata.columns)) continue;
      
      for (const col of source.metadata.columns) {
        if (typeof col === 'string' && col.length > 0) {
          columns.push({
            sourceId,
            sourceName: source.name || 'Unknown',
            columnName: col
          });
        }
      }
    }
    
    return columns;
  }, [dataSources, selectedSources]);

  const filteredColumns = useMemo(() => {
    let filtered = availableColumns;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(col => 
        col.columnName.toLowerCase().includes(term) ||
        col.sourceName.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [availableColumns, searchTerm, fieldFilter]);

  // Initialize from initial configuration
  React.useEffect(() => {
    if (initialConfiguration && !isInitialized) {
      setRowFields(initialConfiguration.row_fields || []);
      setColumnFields(initialConfiguration.column_fields || []);
      setValueFields(initialConfiguration.value_fields || []);
      setIsInitialized(true);
    }
  }, [initialConfiguration, isInitialized]);

  // Manual configuration update function
  const updateConfiguration = () => {
    if (isInitialized) {
      onConfigurationChange({ rowFields, columnFields, valueFields });
    }
  };

  const addField = (sourceId: string, columnName: string, role: 'row' | 'column' | 'value') => {
    const allFields = [...rowFields, ...columnFields, ...valueFields];
    const isDuplicate = allFields.some(f => f.source_id === sourceId && f.column_name === columnName);
    
    if (isDuplicate) return;

    const field: PivotField = {
      source_id: sourceId,
      column_name: columnName,
      role,
      aggregation: role === 'value' ? 'sum' : undefined
    };

    if (role === 'row') {
      const newFields = [...rowFields, field];
      setRowFields(newFields);
      setTimeout(() => updateConfiguration(), 0);
    } else if (role === 'column') {
      const newFields = [...columnFields, field];
      setColumnFields(newFields);
      setTimeout(() => updateConfiguration(), 0);
    } else {
      const newFields = [...valueFields, field];
      setValueFields(newFields);
      setTimeout(() => updateConfiguration(), 0);
    }
  };

  const removeField = (role: 'row' | 'column' | 'value', index: number) => {
    if (role === 'row') {
      const newFields = rowFields.filter((_, i) => i !== index);
      setRowFields(newFields);
      setTimeout(() => updateConfiguration(), 0);
    } else if (role === 'column') {
      const newFields = columnFields.filter((_, i) => i !== index);
      setColumnFields(newFields);
      setTimeout(() => updateConfiguration(), 0);
    } else {
      const newFields = valueFields.filter((_, i) => i !== index);
      setValueFields(newFields);
      setTimeout(() => updateConfiguration(), 0);
    }
  };

  const savePreset = async () => {
    if (!presetName.trim()) return;
    
    try {
      const pivotTable: PivotTableDefinition = {
        id: `pivot_${Date.now()}`,
        name: presetName,
        description: '',
        configuration: {
          row_fields: rowFields,
          column_fields: columnFields,
          value_fields: valueFields
        },
        sheet_name: 'PivotSheet1',
        position: {
          row: 0,
          column: 0
        },
        created_at: new Date().toISOString()
      };

      const preset: Partial<PivotPreset> = {
        name: presetName,
        description: `Preset with ${rowFields.length} rows, ${columnFields.length} columns, ${valueFields.length} values`,
        pivot_tables: [pivotTable]
      };
      
      await createPivotPreset(preset);
      setPresetName('');
      setShowPresets(false);
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  };

  const renderFieldList = (fields: PivotField[], role: 'row' | 'column' | 'value', title: string) => (
    <div className="mb-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div 
        className={`min-h-[60px] p-3 border-2 border-dashed rounded-lg transition-colors ${
          dragTarget === role ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragTarget(role);
        }}
        onDragLeave={() => setDragTarget(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDragTarget(null);
          const data = e.dataTransfer.getData('text/plain');
          try {
            const { sourceId, columnName } = JSON.parse(data);
            addField(sourceId, columnName, role);
          } catch (error) {
            console.error('Failed to parse drag data:', error);
          }
        }}
      >
        {fields.length === 0 ? (
          <p className="text-gray-500 text-sm">Drop fields here or click + to add</p>
        ) : (
          <div className="space-y-1">
            {fields.map((field, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm">
                  {field.column_name}
                  {field.aggregation && ` (${field.aggregation})`}
                </span>
                <button
                  onClick={() => removeField(role, index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Fields */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Available Fields</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowPresets(!showPresets)}
                className="p-2 text-gray-400 hover:text-blue-600 rounded transition-colors"
                title="Manage Presets"
              >
                <BookmarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search fields..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Field List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredColumns.map((column, index) => (
              <div
                key={`${column.sourceId}-${column.columnName}-${index}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', JSON.stringify({
                    sourceId: column.sourceId,
                    columnName: column.columnName
                  }));
                }}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-move"
              >
                <div>
                  <div className="font-medium text-sm">{column.columnName}</div>
                  <div className="text-xs text-gray-500">{column.sourceName}</div>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => addField(column.sourceId, column.columnName, 'row')}
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    title="Add to Rows"
                  >
                    R
                  </button>
                  <button
                    onClick={() => addField(column.sourceId, column.columnName, 'column')}
                    className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    title="Add to Columns"
                  >
                    C
                  </button>
                  <button
                    onClick={() => addField(column.sourceId, column.columnName, 'value')}
                    className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                    title="Add to Values"
                  >
                    V
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pivot Configuration */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Pivot Table Configuration</h3>
          
          {renderFieldList(rowFields, 'row', 'Rows')}
          {renderFieldList(columnFields, 'column', 'Columns')}
          {renderFieldList(valueFields, 'value', 'Values')}
        </div>
      </div>

      {/* Preset Management */}
      {showPresets && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="text"
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={savePreset}
              disabled={!presetName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};