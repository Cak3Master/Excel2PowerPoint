import React, { useState, useMemo } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import { PivotField, DataSource, PivotPreset } from '../../types';
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
  const [rowFields, setRowFields] = useState<PivotField[]>(initialConfiguration?.row_fields || []);
  const [columnFields, setColumnFields] = useState<PivotField[]>(initialConfiguration?.column_fields || []);
  const [valueFields, setValueFields] = useState<PivotField[]>(initialConfiguration?.value_fields || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldFilter, setFieldFilter] = useState<'all' | 'text' | 'number'>('all');
  const [presets, setPresets] = useState<PivotPreset[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [dragTarget, setDragTarget] = useState<string | null>(null);

  const availableColumns = useMemo(() => {
    console.log('PivotConfiguration Debug:', {
      selectedSources,
      dataSources: dataSources.map(ds => ({
        id: ds.id,
        name: ds.name,
        columnCount: ds.metadata?.columns?.length || 0,
        columns: ds.metadata?.columns || []
      }))
    });

    return selectedSources.flatMap(sourceId => {
      const source = dataSources.find(ds => ds.id === sourceId);
      
      if (!source) {
        console.warn(`Data source with ID ${sourceId} not found`);
        return [];
      }
      
      if (!source.metadata || !source.metadata.columns || !Array.isArray(source.metadata.columns)) {
        console.warn(`Data source ${source.name} has invalid or missing column metadata`, source.metadata);
        return [];
      }
      
      return source.metadata.columns.map(col => ({
        sourceId,
        sourceName: source.name,
        columnName: col
      }));
    });
  }, [selectedSources, dataSources]);

  const filteredColumns = useMemo(() => {
    let filtered = availableColumns;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(col => 
        col.columnName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        col.sourceName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter (simplified - in real implementation would check actual data types)
    if (fieldFilter !== 'all') {
      filtered = filtered.filter(col => {
        const columnName = col.columnName.toLowerCase();
        if (fieldFilter === 'number') {
          return columnName.includes('amount') || columnName.includes('price') || 
                 columnName.includes('cost') || columnName.includes('value') ||
                 columnName.includes('total') || columnName.includes('sum') ||
                 columnName.includes('count') || columnName.includes('qty');
        } else if (fieldFilter === 'text') {
          return !columnName.includes('amount') && !columnName.includes('price') && 
                 !columnName.includes('cost') && !columnName.includes('value') &&
                 !columnName.includes('total') && !columnName.includes('sum') &&
                 !columnName.includes('count') && !columnName.includes('qty');
        }
        return true;
      });
    }

    return filtered;
  }, [availableColumns, searchTerm, fieldFilter]);

  // Handle initial configuration changes
  React.useEffect(() => {
    if (initialConfiguration) {
      setRowFields(initialConfiguration.row_fields || []);
      setColumnFields(initialConfiguration.column_fields || []);
      setValueFields(initialConfiguration.value_fields || []);
    }
  }, [initialConfiguration]);

  React.useEffect(() => {
    onConfigurationChange({ rowFields, columnFields, valueFields });
  }, [rowFields, columnFields, valueFields]);

  const addField = (sourceId: string, columnName: string, role: 'row' | 'column' | 'value') => {
    // Check for duplicates
    const allFields = [...rowFields, ...columnFields, ...valueFields];
    const isDuplicate = allFields.some(f => f.source_id === sourceId && f.column_name === columnName);
    
    if (isDuplicate) {
      console.warn(`Field ${columnName} from ${sourceId} is already added to the pivot table`);
      return;
    }

    const field: PivotField = {
      source_id: sourceId,
      column_name: columnName,
      role,
      aggregation: role === 'value' ? 'sum' : undefined
    };

    if (role === 'row') {
      setRowFields([...rowFields, field]);
    } else if (role === 'column') {
      setColumnFields([...columnFields, field]);
    } else {
      setValueFields([...valueFields, field]);
    }
  };

  const removeField = (role: 'row' | 'column' | 'value', index: number) => {
    if (role === 'row') {
      setRowFields(rowFields.filter((_, i) => i !== index));
    } else if (role === 'column') {
      setColumnFields(columnFields.filter((_, i) => i !== index));
    } else {
      setValueFields(valueFields.filter((_, i) => i !== index));
    }
  };

  const savePreset = async () => {
    if (!presetName.trim()) return;
    
    const configuration = {
      row_fields: rowFields,
      column_fields: columnFields,
      value_fields: valueFields
    };

    try {
      const response = await createPivotPreset({
        name: presetName,
        description: `Saved on ${new Date().toLocaleDateString()}`,
        label_id: 'default', // In real implementation, would get from selected label
        pivot_tables: [{
          id: `pivot_${Date.now()}`,
          name: presetName,
          description: `Saved on ${new Date().toLocaleDateString()}`,
          configuration,
          sheet_name: presetName.replace(/\s+/g, '_'),
          position: { row: 1, column: 1 },
          created_at: new Date().toISOString()
        }],
        excel_structure: {
          sheets: [],
          layout: 'separate_sheets',
          include_raw_data: true,
          include_summary: true
        },
        tags: [],
        is_public: false
      });

      if (response.success && response.data) {
        setPresets([...presets, response.data]);
        setPresetName('');
        alert('Preset saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save preset:', error);
      alert('Failed to save preset. Please try again.');
    }
  };

  const loadPreset = (preset: PivotPreset) => {
    const firstPivotTable = preset.pivot_tables[0];
    if (firstPivotTable) {
      setRowFields(firstPivotTable.configuration.row_fields || []);
      setColumnFields(firstPivotTable.configuration.column_fields || []);
      setValueFields(firstPivotTable.configuration.value_fields || []);
    }
    setShowPresets(false);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Configure Pivot Table</h3>
      
      {/* Debug Information */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3 text-xs">
          <h4 className="font-semibold text-gray-700 mb-2">Debug Info:</h4>
          <div className="space-y-1">
            <div><strong>Selected Sources:</strong> {selectedSources.length} ({selectedSources.join(', ')})</div>
            <div><strong>Available Data Sources:</strong> {dataSources.length}</div>
            <div><strong>Available Columns:</strong> {availableColumns.length}</div>
            {availableColumns.length === 0 && selectedSources.length > 0 && (
              <div className="text-red-600"><strong>Warning:</strong> No columns found for selected sources</div>
            )}
          </div>
        </div>
      )}
      
      {/* Available Columns with Search */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700">Available Columns</h4>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
            >
              <BookmarkIcon className="h-3 w-3 mr-1" />
              Presets
            </button>
            <span className="text-xs text-gray-500">
              {filteredColumns.length} columns
            </span>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-full"
            />
          </div>
          <select
            value={fieldFilter}
            onChange={(e) => setFieldFilter(e.target.value as 'all' | 'text' | 'number')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="all">All Fields</option>
            <option value="text">Text Fields</option>
            <option value="number">Number Fields</option>
          </select>
        </div>

        {/* Presets Section */}
        {showPresets && (
          <div className="mb-4 p-3 bg-white border border-gray-200 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Saved Presets</h5>
            <div className="space-y-2">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{preset.name}</div>
                    <div className="text-xs text-gray-500">{preset.description}</div>
                  </div>
                  <button
                    onClick={() => loadPreset(preset)}
                    className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                  >
                    Load
                  </button>
                </div>
              ))}
              {presets.length === 0 && (
                <p className="text-sm text-gray-500">No presets saved yet</p>
              )}
            </div>
            
            {/* Save Current Configuration */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Preset name..."
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                <button
                  onClick={savePreset}
                  disabled={!presetName.trim() || (rowFields.length === 0 && columnFields.length === 0 && valueFields.length === 0)}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredColumns.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {filteredColumns.map((col, index) => {
              const allFields = [...rowFields, ...columnFields, ...valueFields];
              const isUsed = allFields.some(f => f.source_id === col.sourceId && f.column_name === col.columnName);
              
              return (
              <div
                key={`${col.sourceId}-${col.columnName}-${index}`}
                className="group relative"
                draggable={!isUsed}
                onDragStart={(e) => {
                  if (isUsed) {
                    e.preventDefault();
                    return;
                  }
                  e.dataTransfer.setData('application/json', JSON.stringify({
                    sourceId: col.sourceId,
                    columnName: col.columnName,
                    sourceName: col.sourceName
                  }));
                }}
              >
                <div className={`p-2 border rounded text-sm transition-all ${
                  isUsed 
                    ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-white border-gray-200 cursor-move hover:shadow-md'
                }`}>
                  <div className="font-medium truncate flex items-center">
                    {col.columnName}
                    {isUsed && <span className="ml-1 text-xs">✓</span>}
                  </div>
                  <div className="text-xs text-gray-500">{col.sourceName}</div>
                </div>
                
                {/* Quick Add Buttons */}
                {!isUsed && (
                  <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      <button
                        onClick={() => addField(col.sourceId, col.columnName, 'row')}
                        className="p-1 bg-blue-100 hover:bg-blue-200 rounded text-xs"
                        title="Add to Rows"
                      >
                        R
                      </button>
                      <button
                        onClick={() => addField(col.sourceId, col.columnName, 'column')}
                        className="p-1 bg-green-100 hover:bg-green-200 rounded text-xs"
                        title="Add to Columns"
                      >
                        C
                      </button>
                      <button
                        onClick={() => addField(col.sourceId, col.columnName, 'value')}
                        className="p-1 bg-yellow-100 hover:bg-yellow-200 rounded text-xs"
                        title="Add to Values"
                      >
                        V
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-white">
            <div className="text-gray-400 text-sm">
              {selectedSources.length === 0 ? (
                <div>
                  <p className="font-medium">No data sources selected</p>
                  <p className="mt-1">Select data sources from the previous step to see available columns</p>
                </div>
              ) : availableColumns.length === 0 ? (
                <div>
                  <p className="font-medium">No columns available</p>
                  <p className="mt-1">The selected data sources don't have column metadata available</p>
                  <p className="mt-1 text-xs">Check the debug info above for more details</p>
                </div>
              ) : (
                <div>
                  <p className="font-medium">No columns match your filters</p>
                  <p className="mt-1">Try adjusting your search or filter settings</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Pivot Configuration Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Row Fields */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Row Fields</h4>
          <div 
            className={`min-h-24 p-3 border-2 border-dashed rounded-lg transition-colors ${
              dragTarget === 'row' 
                ? 'border-blue-400 bg-blue-100' 
                : 'border-blue-200 bg-blue-50'
            }`}
            onDrop={(e) => {
              e.preventDefault();
              setDragTarget(null);
              try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                addField(data.sourceId, data.columnName, 'row');
              } catch (error) {
                console.error('Error parsing dropped data:', error);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragTarget('row');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragTarget(null);
            }}
          >
            {rowFields.map((field, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white border rounded mb-2 shadow-sm">
                <div className="flex-1">
                  <span className="text-sm font-medium">{field.column_name}</span>
                  <div className="text-xs text-gray-500">
                    {dataSources.find(ds => ds.id === field.source_id)?.name || field.source_id}
                  </div>
                </div>
                <button
                  onClick={() => removeField('row', index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove field"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {rowFields.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                <div className="mb-2">📊 Row Fields</div>
                <div>Drag columns here or use quick add buttons (R)</div>
                <div className="text-xs mt-1">Rows group your data vertically</div>
              </div>
            )}
          </div>
        </div>

        {/* Column Fields */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Column Fields</h4>
          <div 
            className={`min-h-24 p-3 border-2 border-dashed rounded-lg transition-colors ${
              dragTarget === 'column' 
                ? 'border-green-400 bg-green-100' 
                : 'border-green-200 bg-green-50'
            }`}
            onDrop={(e) => {
              e.preventDefault();
              setDragTarget(null);
              try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                addField(data.sourceId, data.columnName, 'column');
              } catch (error) {
                console.error('Error parsing dropped data:', error);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragTarget('column');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragTarget(null);
            }}
          >
            {columnFields.map((field, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white border rounded mb-2 shadow-sm">
                <div className="flex-1">
                  <span className="text-sm font-medium">{field.column_name}</span>
                  <div className="text-xs text-gray-500">
                    {dataSources.find(ds => ds.id === field.source_id)?.name || field.source_id}
                  </div>
                </div>
                <button
                  onClick={() => removeField('column', index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Remove field"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
            {columnFields.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                <div className="mb-2">📋 Column Fields</div>
                <div>Drag columns here or use quick add buttons (C)</div>
                <div className="text-xs mt-1">Columns group your data horizontally</div>
              </div>
            )}
          </div>
        </div>

        {/* Value Fields */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Value Fields</h4>
          <div 
            className={`min-h-24 p-3 border-2 border-dashed rounded-lg transition-colors ${
              dragTarget === 'value' 
                ? 'border-yellow-400 bg-yellow-100' 
                : 'border-yellow-200 bg-yellow-50'
            }`}
            onDrop={(e) => {
              e.preventDefault();
              setDragTarget(null);
              try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                addField(data.sourceId, data.columnName, 'value');
              } catch (error) {
                console.error('Error parsing dropped data:', error);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDragTarget('value');
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragTarget(null);
            }}
          >
            {valueFields.map((field, index) => (
              <div key={index} className="space-y-2 p-2 bg-white border rounded mb-2 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <span className="text-sm font-medium">{field.column_name}</span>
                    <div className="text-xs text-gray-500">
                      {dataSources.find(ds => ds.id === field.source_id)?.name || field.source_id}
                    </div>
                  </div>
                  <button
                    onClick={() => removeField('value', index)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove field"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
                <select
                  value={field.aggregation || 'sum'}
                  onChange={(e) => {
                    const newFields = [...valueFields];
                    newFields[index].aggregation = e.target.value as any;
                    setValueFields(newFields);
                  }}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                >
                  <option value="sum">Sum</option>
                  <option value="count">Count</option>
                  <option value="mean">Average</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>
            ))}
            {valueFields.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                <div className="mb-2">🔢 Value Fields</div>
                <div>Drag columns here or use quick add buttons (V)</div>
                <div className="text-xs mt-1">Values are the numeric data to calculate</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Configuration Summary */}
      {(rowFields.length > 0 || columnFields.length > 0 || valueFields.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Pivot Configuration</h4>
          <div className="text-sm text-blue-700">
            <div>Rows: {rowFields.length > 0 ? rowFields.map(f => f.column_name).join(', ') : 'None'}</div>
            <div>Columns: {columnFields.length > 0 ? columnFields.map(f => f.column_name).join(', ') : 'None'}</div>
            <div>Values: {valueFields.length > 0 ? valueFields.map(f => `${f.column_name} (${f.aggregation})`).join(', ') : 'None'}</div>
          </div>
        </div>
      )}
    </div>
  );
};