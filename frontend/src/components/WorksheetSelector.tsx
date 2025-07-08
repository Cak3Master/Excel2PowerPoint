import React, { useState, useCallback } from 'react';
import { Worksheet } from '../types';

export interface WorksheetRange {
  worksheetName: string;
  startCell: string;
  endCell: string;
  includeInDownload: boolean;
}

interface WorksheetSelectorProps {
  worksheets: Worksheet[];
  selectedWorksheet: string | null;
  onWorksheetSelect: (worksheetName: string) => void;
  worksheetRanges: WorksheetRange[];
  onRangeUpdate: (ranges: WorksheetRange[]) => void;
}

export const WorksheetSelector: React.FC<WorksheetSelectorProps> = ({
  worksheets,
  selectedWorksheet,
  onWorksheetSelect,
  worksheetRanges,
  onRangeUpdate,
}) => {
  const [expandedWorksheet, setExpandedWorksheet] = useState<string | null>(null);

  const handleWorksheetClick = useCallback((worksheetName: string) => {
    onWorksheetSelect(worksheetName);
    setExpandedWorksheet(expandedWorksheet === worksheetName ? null : worksheetName);
  }, [onWorksheetSelect, expandedWorksheet]);

  const updateRange = useCallback((worksheetName: string, field: keyof WorksheetRange, value: string | boolean) => {
    const updatedRanges = worksheetRanges.map(range => 
      range.worksheetName === worksheetName 
        ? { ...range, [field]: value }
        : range
    );
    
    // If this worksheet doesn't have a range yet, create one
    if (!worksheetRanges.find(r => r.worksheetName === worksheetName)) {
      const worksheet = worksheets.find(w => w.name === worksheetName);
      if (worksheet) {
        updatedRanges.push({
          worksheetName,
          startCell: 'A1',
          endCell: `${String.fromCharCode(64 + Math.min(worksheet.columns, 26))}${Math.min(worksheet.rows, 50)}`,
          includeInDownload: field === 'includeInDownload' ? value as boolean : true,
          [field]: value
        });
      }
    }
    
    onRangeUpdate(updatedRanges);
  }, [worksheetRanges, onRangeUpdate, worksheets]);

  const getWorksheetRange = useCallback((worksheetName: string): WorksheetRange | null => {
    return worksheetRanges.find(r => r.worksheetName === worksheetName) || null;
  }, [worksheetRanges]);

  const addNewRange = useCallback((worksheetName: string) => {
    const worksheet = worksheets.find(w => w.name === worksheetName);
    if (!worksheet) return;

    const existingRanges = worksheetRanges.filter(r => r.worksheetName === worksheetName);
    const newRange: WorksheetRange = {
      worksheetName,
      startCell: 'A1',
      endCell: `${String.fromCharCode(64 + Math.min(worksheet.columns, 26))}${Math.min(worksheet.rows, 50)}`,
      includeInDownload: true,
    };

    onRangeUpdate([...worksheetRanges, newRange]);
  }, [worksheets, worksheetRanges, onRangeUpdate]);

  const removeRange = useCallback((worksheetName: string, rangeIndex: number) => {
    const updatedRanges = worksheetRanges.filter((range, index) => 
      !(range.worksheetName === worksheetName && index === rangeIndex)
    );
    onRangeUpdate(updatedRanges);
  }, [worksheetRanges, onRangeUpdate]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderTop: '4px solid #006FCF' }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#006FCF' }}>Select Worksheets and Ranges</h3>
      
      {(!worksheets || worksheets.length === 0) ? (
        <p className="text-gray-500">No worksheets found in the Excel file.</p>
      ) : (
        <div className="space-y-3">
          {worksheets.filter(ws => ws.has_data).map((worksheet) => {
            const worksheetRangeList = worksheetRanges.filter(r => r.worksheetName === worksheet.name);
            const isExpanded = expandedWorksheet === worksheet.name;
            const isSelected = selectedWorksheet === worksheet.name;
            
            return (
              <div key={worksheet.name} className="border rounded-lg">
                <div
                  onClick={() => handleWorksheetClick(worksheet.name)}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: isSelected ? '#006FCF' : 'transparent',
                    color: isSelected ? 'white' : 'inherit'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{worksheet.name}</div>
                      <div className="text-sm text-gray-500">
                        {worksheet.rows} rows × {worksheet.columns} columns
                      </div>
                      {worksheetRangeList.length > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                          {worksheetRangeList.length} range(s) configured
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateRange(worksheet.name, 'includeInDownload', !getWorksheetRange(worksheet.name)?.includeInDownload);
                        }}
                        className={`w-4 h-4 rounded border-2 transition-colors ${
                          getWorksheetRange(worksheet.name)?.includeInDownload
                            ? 'border-blue-500'
                            : 'border-gray-300 hover:border-blue-400'
                        }`}
                        style={{
                          backgroundColor: getWorksheetRange(worksheet.name)?.includeInDownload ? '#006FCF' : 'transparent'
                        }}
                      >
                        {getWorksheetRange(worksheet.name)?.includeInDownload && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <span className="text-xs text-gray-500">Include</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedWorksheet(isExpanded ? null : worksheet.name);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg 
                          className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t bg-gray-50 p-4">
                    <h4 className="text-sm font-medium mb-3">Configure Ranges for {worksheet.name}</h4>
                    
                    {worksheetRangeList.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">No ranges configured</p>
                        <button
                          onClick={() => addNewRange(worksheet.name)}
                          className="px-3 py-1 text-white text-sm rounded hover:opacity-90 transition-all transform hover:scale-105"
                          style={{ backgroundColor: '#006FCF' }}
                        >
                          Add Range
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {worksheetRangeList.map((range, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 bg-white rounded border">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">Start Cell</label>
                                <input
                                  type="text"
                                  value={range.startCell}
                                  onChange={(e) => updateRange(worksheet.name, 'startCell', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1"
                                  style={{ '--tw-ring-color': '#006FCF' } as any}
                                  placeholder="A1"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">End Cell</label>
                                <input
                                  type="text"
                                  value={range.endCell}
                                  onChange={(e) => updateRange(worksheet.name, 'endCell', e.target.value)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1"
                                  style={{ '--tw-ring-color': '#006FCF' } as any}
                                  placeholder="Z50"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeRange(worksheet.name, index)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Remove range"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => addNewRange(worksheet.name)}
                          className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 text-sm rounded hover:text-blue-600 transition-all"
                          style={{ '--hover-border': '#006FCF' } as any}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#006FCF'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#d1d5db'}
                        >
                          + Add Another Range
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};