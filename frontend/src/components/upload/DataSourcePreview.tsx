import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, TableCellsIcon } from '@heroicons/react/24/outline';
import { DataSource, AgentResponse } from '../../types';
import { getDataSourcePreview } from '../../services/api';

interface DataSourcePreviewProps {
  dataSource: DataSource;
  maxRows?: number;
  onColumnSelect?: (columns: string[]) => void;
  selectable?: boolean;
}

interface PreviewData {
  columns: Array<{
    name: string;
    type: string;
    non_null_count: number;
    unique_count: number;
  }>;
  preview: Record<string, any>[];
  total_rows: number;
}

export const DataSourcePreview: React.FC<DataSourcePreviewProps> = ({
  dataSource,
  maxRows = 10,
  onColumnSelect,
  selectable = false
}) => {
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showDataTypes, setShowDataTypes] = useState(false);

  useEffect(() => {
    loadPreview();
  }, [dataSource.id]);

  const loadPreview = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response: AgentResponse<PreviewData> = await getDataSourcePreview(
        dataSource.id, 
        maxRows, 
        currentPage
      );
      
      if (response.success && response.data) {
        setPreviewData(response.data);
      } else {
        setError(response.error || 'Failed to load preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const toggleColumnSelection = (columnName: string) => {
    if (!selectable) return;
    
    const newSelection = new Set(selectedColumns);
    if (newSelection.has(columnName)) {
      newSelection.delete(columnName);
    } else {
      newSelection.add(columnName);
    }
    setSelectedColumns(newSelection);
    onColumnSelect?.(Array.from(newSelection));
  };

  const selectAllColumns = () => {
    if (!selectable || !previewData) return;
    
    const allColumns = previewData.columns.map(col => col.name);
    setSelectedColumns(new Set(allColumns));
    onColumnSelect?.(allColumns);
  };

  const clearSelection = () => {
    if (!selectable) return;
    
    setSelectedColumns(new Set());
    onColumnSelect?.([]);
  };

  const formatValue = (value: any) => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400 italic">null</span>;
    }
    if (typeof value === 'number') {
      return value.toLocaleString();
    }
    if (typeof value === 'boolean') {
      return value.toString();
    }
    const str = String(value);
    return str.length > 50 ? `${str.substring(0, 50)}...` : str;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'int64': 'bg-blue-100 text-blue-800',
      'float64': 'bg-green-100 text-green-800',
      'object': 'bg-gray-100 text-gray-800',
      'datetime64': 'bg-purple-100 text-purple-800',
      'bool': 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading preview...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={loadPreview}
          className="mt-2 text-sm text-red-700 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!previewData) {
    return (
      <div className="text-center py-8">
        <TableCellsIcon className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-2 text-sm text-gray-500">No preview data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <EyeIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
          <span className="text-sm text-gray-500">
            ({previewData.preview.length} of {previewData.total_rows.toLocaleString()} rows)
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDataTypes(!showDataTypes)}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              showDataTypes 
                ? 'bg-blue-50 border-blue-200 text-blue-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Data Types
          </button>
          
          {selectable && (
            <div className="flex space-x-1">
              <button
                onClick={selectAllColumns}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column Selection Summary */}
      {selectable && selectedColumns.size > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            {selectedColumns.size} column{selectedColumns.size !== 1 ? 's' : ''} selected: {' '}
            <span className="font-medium">
              {Array.from(selectedColumns).join(', ')}
            </span>
          </p>
        </div>
      )}

      {/* Data Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {previewData.columns.map((column) => (
                  <th
                    key={column.name}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none ${
                      selectable ? 'hover:bg-gray-100' : ''
                    } ${
                      selectedColumns.has(column.name) ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => toggleColumnSelection(column.name)}
                  >
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate max-w-32">{column.name}</span>
                        {selectable && selectedColumns.has(column.name) && (
                          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      
                      {showDataTypes && (
                        <div className="flex flex-col space-y-1 text-xs">
                          <span className={`inline-flex px-2 py-0.5 rounded-full font-medium ${getTypeColor(column.type)}`}>
                            {column.type}
                          </span>
                          <span className="text-gray-400">
                            {column.non_null_count}/{previewData.total_rows} non-null
                          </span>
                          <span className="text-gray-400">
                            {column.unique_count.toLocaleString()} unique
                          </span>
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.preview.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {previewData.columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column.name}`}
                      className={`px-4 py-3 text-sm text-gray-900 ${
                        selectedColumns.has(column.name) ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="max-w-48 truncate">
                        {formatValue(row[column.name])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {previewData.total_rows > maxRows && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Previous
          </button>
          
          <span className="text-sm text-gray-500">
            Showing rows {currentPage * maxRows + 1} - {Math.min((currentPage + 1) * maxRows, previewData.total_rows)}
          </span>
          
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={(currentPage + 1) * maxRows >= previewData.total_rows}
            className="flex items-center px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};