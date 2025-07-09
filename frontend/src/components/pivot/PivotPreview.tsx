import React, { useState, useEffect } from 'react';
import { 
  TableCellsIcon, 
  ArrowDownTrayIcon, 
  EyeIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { PivotField, PivotResult } from '../../types';

interface PivotPreviewProps {
  pivotData: PivotResult | null;
  configuration: {
    rowFields: PivotField[];
    columnFields: PivotField[];
    valueFields: PivotField[];
  };
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
  onExport?: (format: 'excel' | 'powerpoint') => void;
}

export const PivotPreview: React.FC<PivotPreviewProps> = ({
  pivotData,
  configuration,
  loading = false,
  error,
  onRefresh,
  onExport
}) => {
  const [exportFormat, setExportFormat] = useState<'excel' | 'powerpoint'>('excel');
  const [hoveredCell, setHoveredCell] = useState<{row: number, col: number} | null>(null);

  const hasConfiguration = configuration.rowFields.length > 0 || 
                          configuration.columnFields.length > 0 || 
                          configuration.valueFields.length > 0;

  const formatValue = (value: any, field?: PivotField) => {
    if (value === null || value === undefined) return '-';
    
    if (field?.aggregation && typeof value === 'number') {
      if (['count', 'sum'].includes(field.aggregation)) {
        return value.toLocaleString();
      } else if (['mean'].includes(field.aggregation)) {
        return value.toFixed(2);
      }
    }
    
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    
    return String(value);
  };

  const getCellClass = (rowIndex: number, colIndex: number, isHeader: boolean = false) => {
    const baseClass = "px-3 py-2 text-sm border-r border-b border-gray-200";
    const hoverClass = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex 
      ? "bg-blue-50" : "";
    
    if (isHeader) {
      return `${baseClass} ${hoverClass} bg-gray-50 font-medium text-gray-900 sticky top-0`;
    }
    
    return `${baseClass} ${hoverClass} text-gray-700 hover:bg-gray-50`;
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900">Pivot Table Preview</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ArrowPathIcon className="mx-auto h-8 w-8 text-blue-600 animate-spin" />
            <p className="mt-2 text-sm text-gray-600">Generating pivot table...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900">Pivot Table Preview</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-400" />
            <p className="mt-2 text-sm text-red-600">{error}</p>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!hasConfiguration) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900">Pivot Table Preview</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <TableCellsIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">No configuration</h4>
            <p className="mt-1 text-sm text-gray-500">
              Configure row, column, or value fields to generate a pivot table.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!pivotData) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-medium text-gray-900">Pivot Table Preview</h3>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <TableCellsIcon className="mx-auto h-12 w-12 text-gray-300" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">No data available</h4>
            <p className="mt-1 text-sm text-gray-500">
              Configure your pivot table to see the results.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Pivot Table Preview</h3>
            <p className="text-sm text-gray-500 mt-1">
              {pivotData.data.length} rows × {pivotData.columns.length} columns
            </p>
          </div>
          
          {onExport && (
            <div className="flex items-center space-x-2">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'excel' | 'powerpoint')}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="excel">Excel</option>
                <option value="powerpoint">PowerPoint</option>
              </select>
              <button
                onClick={() => onExport(exportFormat)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Summary */}
      <div className="border-b border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center space-x-6 text-xs text-gray-600">
          <div>
            <span className="font-medium">Rows:</span> {configuration.rowFields.map(f => f.column_name).join(', ') || 'None'}
          </div>
          <div>
            <span className="font-medium">Columns:</span> {configuration.columnFields.map(f => f.column_name).join(', ') || 'None'}
          </div>
          <div>
            <span className="font-medium">Values:</span> {configuration.valueFields.map(f => `${f.column_name} (${f.aggregation})`).join(', ') || 'None'}
          </div>
        </div>
        <div className="flex items-center space-x-6 text-xs text-gray-500 mt-2">
          <div>
            <span className="font-medium">Format:</span> Tabular Layout
          </div>
          <div>
            <span className="font-medium">Subtotals:</span> Disabled
          </div>
          <div>
            <span className="font-medium">Grand Total:</span> Enabled
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-96">
        <table className="min-w-full">
          <thead>
            <tr>
              {pivotData.columns.map((column, colIndex) => (
                <th
                  key={colIndex}
                  className={getCellClass(0, colIndex, true)}
                  onMouseEnter={() => setHoveredCell({row: 0, col: colIndex})}
                  onMouseLeave={() => setHoveredCell(null)}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pivotData.data.slice(0, 100).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => {
                  const isRowHeader = configuration.rowFields.length > 0 && colIndex < configuration.rowFields.length;
                  const valueField = configuration.valueFields.find(f => 
                    pivotData.columns[colIndex].includes(f.column_name)
                  );
                  
                  return (
                    <td
                      key={colIndex}
                      className={`${getCellClass(rowIndex + 1, colIndex, isRowHeader)} ${isRowHeader ? 'font-medium bg-gray-50' : ''}`}
                      onMouseEnter={() => setHoveredCell({row: rowIndex + 1, col: colIndex})}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {formatValue(cell, valueField)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {pivotData.data.length > 100 && (
          <div className="p-3 text-center text-sm text-gray-500 border-t border-gray-200 bg-gray-50">
            Showing first 100 rows of {pivotData.data.length} total rows
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="border-t border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Total Rows: {pivotData.data.length.toLocaleString()}</span>
            <span>•</span>
            <span>Columns: {pivotData.columns.length}</span>
            {pivotData.metadata?.aggregation_time && (
              <>
                <span>•</span>
                <span>Generated in {pivotData.metadata.aggregation_time}ms</span>
              </>
            )}
          </div>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center text-blue-600 hover:text-blue-800"
            >
              <ArrowPathIcon className="h-3 w-3 mr-1" />
              Refresh
            </button>
          )}
        </div>
      </div>
    </div>
  );
};