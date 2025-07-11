import React, { useState } from 'react';
import { 
  ChartBarIcon, 
  TableCellsIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { ExcelFilePreview as ExcelFilePreviewType, ExcelSheetPreview } from '../../types';

interface ExcelFilePreviewProps {
  excelPreview: ExcelFilePreviewType;
  onDownload?: () => void;
  onExport?: (format: 'excel' | 'powerpoint') => void;
}

export const ExcelFilePreview: React.FC<ExcelFilePreviewProps> = ({
  excelPreview,
  onDownload,
  onExport
}) => {
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [exportFormat, setExportFormat] = useState<'excel' | 'powerpoint'>('excel');

  const getSheetIcon = (sheet: ExcelSheetPreview) => {
    switch (sheet.type) {
      case 'pivot':
        return <ChartBarIcon className="h-5 w-5 text-blue-600" />;
      case 'summary':
        return <InformationCircleIcon className="h-5 w-5 text-green-600" />;
      default:
        return <TableCellsIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getSheetTypeColor = (type: string) => {
    switch (type) {
      case 'pivot':
        return 'bg-blue-100 text-blue-800';
      case 'summary':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeSheet = excelPreview.sheets[activeSheetIndex];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Excel File Preview</h3>
            <p className="text-sm text-gray-500 mt-1">
              {excelPreview.name}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'excel' | 'powerpoint')}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="powerpoint">PowerPoint (.pptx)</option>
            </select>
            
            {onExport && (
              <button
                onClick={() => onExport(exportFormat)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>

      {/* File Statistics */}
      <div className="border-b border-gray-200 bg-gray-50 p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-900">{excelPreview.sheets.length}</div>
            <div className="text-gray-500">Total Sheets</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{excelPreview.sheets.filter(s => s.type === 'pivot').length}</div>
            <div className="text-gray-500">Pivot Tables</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">{excelPreview.sheets.filter(s => s.type === 'data').length}</div>
            <div className="text-gray-500">Data Sheets</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-900">
              {excelPreview.sheets.reduce((sum, sheet) => sum + (sheet.row_count || 0), 0).toLocaleString()}
            </div>
            <div className="text-gray-500">Total Rows</div>
          </div>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto">
          {excelPreview.sheets.map((sheet, index) => (
            <button
              key={sheet.name}
              onClick={() => setActiveSheetIndex(index)}
              className={`
                flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap min-w-0
                ${index === activeSheetIndex
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                {getSheetIcon(sheet)}
                <div className="flex flex-col">
                  <span className="font-medium">{sheet.name}</span>
                  <span className="text-xs text-gray-500">
                    {sheet.row_count?.toLocaleString() || 0} rows
                  </span>
                </div>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${getSheetTypeColor(sheet.type)}`}>
                  {sheet.type}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Sheet Content */}
      {activeSheet && (
        <div className="p-4">
          {/* Sheet Info */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-md font-medium text-gray-900">
                {activeSheet.name}
              </h4>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{(activeSheet.row_count || 0).toLocaleString()} rows</span>
                <span>{activeSheet.column_count || 0} columns</span>
                {activeSheet.preview_data && (
                  <span>
                    {activeSheet.preview_data.length > 10 ? '10+' : activeSheet.preview_data.length} preview rows
                  </span>
                )}
              </div>
            </div>
            
            {activeSheet.source_label && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Source Label:</span> {activeSheet.source_label}
              </div>
            )}
          </div>

          {/* Data Preview */}
          <div className="relative">
            <div className="overflow-auto max-h-96 border border-gray-200 rounded-lg">
              {activeSheet.preview_data && activeSheet.preview_data.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {activeSheet.columns.map((column, index) => (
                      <th
                        key={index}
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column || `Column ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSheet.preview_data.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap"
                        >
                          {cell !== null && cell !== undefined && cell !== '' 
                            ? (typeof cell === 'number' ? cell.toLocaleString() : String(cell))
                            : <span className="text-gray-400 italic">—</span>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <div className="text-sm">No preview data available</div>
                <div className="text-xs mt-1">Data will be populated when the Excel file is generated</div>
              </div>
            )}
            </div>
            {/* Scroll hint */}
            {activeSheet.preview_data && activeSheet.preview_data.length > 0 && activeSheet.columns && activeSheet.columns.length > 4 && (
              <div className="absolute bottom-2 right-2 bg-gray-900 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                Scroll to see more columns →
              </div>
            )}
          </div>

          {/* Show More Indicator */}
          {activeSheet.preview_data && activeSheet.preview_data.length > 10 && (
            <div className="mt-2 text-center text-sm text-gray-500">
              Showing first 10 rows of {(activeSheet.row_count || 0).toLocaleString()} total rows
            </div>
          )}

          {/* Sheet-specific Information */}
          {activeSheet.type === 'pivot' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Pivot Table Details</h5>
              <div className="text-sm text-blue-700">
                <p>This sheet contains a pivot table with aggregated data from your source files.</p>
                {activeSheet.source_label && (
                  <p className="mt-1">
                    <span className="font-medium">Source Label:</span> {activeSheet.source_label}
                  </p>
                )}
                {activeSheet.source_data_source_id && (
                  <p className="mt-1">
                    <span className="font-medium">Source Data:</span> {activeSheet.source_data_source_id}
                  </p>
                )}
                <p className="mt-1">
                  <span className="font-medium">Data Shape:</span> {activeSheet.row_count.toLocaleString()} rows × {activeSheet.column_count} columns
                </p>
              </div>
            </div>
          )}

          {activeSheet.type === 'summary' && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <h5 className="text-sm font-medium text-green-900 mb-2">Summary Sheet</h5>
              <div className="text-sm text-green-700">
                <p>This sheet contains summary statistics and metadata about the Excel file.</p>
                <p className="mt-1">
                  <span className="font-medium">Total Sheets:</span> {excelPreview.sheets.length}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Pivot Tables:</span> {excelPreview.pivot_tables.length}
                </p>
                <p className="mt-1">
                  <span className="font-medium">Raw Data Sheets:</span> {excelPreview.raw_data_sheets.length}
                </p>
                <p className="mt-1">
                  <span className="font-medium">File Size:</span> {(excelPreview.metadata.file_size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          )}

          {activeSheet.type === 'data' && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h5 className="text-sm font-medium text-gray-900 mb-2">Raw Data Sheet</h5>
              <div className="text-sm text-gray-700">
                <p>This sheet contains raw data from your uploaded source files.</p>
                {activeSheet.source_label && (
                  <p className="mt-1">
                    <span className="font-medium">Source Label:</span> {activeSheet.source_label}
                  </p>
                )}
                {activeSheet.source_data_source_id && (
                  <p className="mt-1">
                    <span className="font-medium">Source File:</span> {activeSheet.source_data_source_id}
                  </p>
                )}
                <p className="mt-1">
                  <span className="font-medium">Data Shape:</span> {activeSheet.row_count.toLocaleString()} rows × {activeSheet.column_count} columns
                </p>
                <p className="mt-1">
                  <span className="font-medium">Available Fields:</span> {activeSheet.columns.slice(0, 5).join(', ')}{activeSheet.columns.length > 5 ? ` and ${activeSheet.columns.length - 5} more` : ''}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generation Info */}
      <div className="border-t border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Generated on: {excelPreview.metadata.created_at}</span>
          <span>File ID: {excelPreview.id}</span>
        </div>
      </div>
    </div>
  );
};