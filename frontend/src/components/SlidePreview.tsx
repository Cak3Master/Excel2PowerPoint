import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CellData } from '../types';
import { 
  loadSheetState, 
  saveSheetState, 
  SheetState, 
  DEFAULT_SHEET_STATE 
} from '../utils/localStorage';

interface SlidePreviewProps {
  slideContent: CellData[][];
  slideCount: number;
  currentSlide: number;
  onSlideChange: (slide: number) => void;
  sheetKey: string | null;
  onPreviewChange: (previewRows: number, previewColumns: number) => void;
  customRange?: { startCell: string; endCell: string; } | null;
}

const formatCellColor = (color: number[] | string | null | undefined): string | undefined => {
  if (!color) return undefined;
  
  if (Array.isArray(color) && color.length === 3) {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
  } else if (typeof color === 'string' && color.length >= 6) {
    let hex = color;
    if (hex.length === 8) {
      hex = hex.substring(2);
    }
    return `#${hex}`;
  }
  
  return undefined;
};

export const SlidePreview: React.FC<SlidePreviewProps> = ({
  slideContent,
  slideCount,
  currentSlide,
  onSlideChange,
  sheetKey,
  onPreviewChange,
  customRange,
}) => {
  // Local state for this sheet
  const [sheetState, setSheetState] = useState<SheetState>(DEFAULT_SHEET_STATE);
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs to hold current state for drag operations (to avoid stale closures)
  const currentStateRef = useRef<SheetState>(DEFAULT_SHEET_STATE);
  const dragInfoRef = useRef<{
    type: 'column' | 'row' | null;
    index: number;
    startPos: number;
    startSize: number;
  }>({ type: null, index: -1, startPos: 0, startSize: 0 });
  
  // Keep ref in sync with state
  useEffect(() => {
    currentStateRef.current = sheetState;
  }, [sheetState]);
  
  // Debounced save function
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSave = useCallback((state: SheetState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (sheetKey) {
        saveSheetState(sheetKey, state);
      }
    }, 200);
  }, [sheetKey]);

  // Load sheet-specific state when sheetKey changes
  useEffect(() => {
    if (sheetKey) {
      const savedState = loadSheetState(sheetKey);
      setSheetState(savedState);
      currentStateRef.current = savedState;
    } else {
      setSheetState(DEFAULT_SHEET_STATE);
      currentStateRef.current = DEFAULT_SHEET_STATE;
    }
  }, [sheetKey]);

  // Update state function
  const updateSheetState = useCallback((updates: Partial<SheetState>) => {
    const newState = { ...currentStateRef.current, ...updates };
    setSheetState(newState);
    currentStateRef.current = newState;
    debouncedSave(newState);
  }, [debouncedSave]);

  // Calculate optimal column width based on content - EXTREMELY generous to prevent ALL wrapping
  const calculateColumnWidth = useCallback((columnIndex: number): number => {
    if (!slideContent || slideContent.length === 0) return 400;
    
    let maxWidth = 400; // EXTREMELY generous minimum width
    
    // Check all cells in this column
    for (let rowIndex = 0; rowIndex < slideContent.length; rowIndex++) {
      const cell = slideContent[rowIndex][columnIndex];
      if (cell && cell.value) {
        const text = String(cell.value);
        // EXTREMELY generous width estimation to prevent ANY wrapping
        // Each character is roughly 25-30 pixels wide to be absolutely safe
        let estimatedWidth = text.length * 25; // Increased from 20 to 25
        
        // Add massive padding for bold text
        if (cell.font_bold) {
          estimatedWidth *= 1.8; // Increased from 1.5 to 1.8
        }
        
        // Header rows get MASSIVE extra space to prevent wrapping
        if (rowIndex < sheetState.headerRows) {
          estimatedWidth *= 2.5; // Increased from 2.0 to 2.5
        }
        
        // Add MASSIVE base padding for cell content
        estimatedWidth += 150; // Increased from 100px to 150px padding
        
        maxWidth = Math.max(maxWidth, estimatedWidth);
      }
    }
    
    // No maximum limit - let columns be as wide as needed
    return Math.min(maxWidth, 2000); // Increased from 1200 to 2000
  }, [slideContent, sheetState.headerRows]);

  // Initialize column widths and row heights when content changes
  useEffect(() => {
    if (slideContent.length > 0) {
      const numCols = slideContent[0]?.length || 0;
      const numRows = slideContent.length;
      
      const needsColumnUpdate = currentStateRef.current.columnWidths.length !== numCols;
      const needsRowUpdate = currentStateRef.current.rowHeights.length !== numRows;
      
      if (needsColumnUpdate || needsRowUpdate) {
        const updates: Partial<SheetState> = {};
        
        if (needsColumnUpdate) {
          // Calculate optimal widths for each column
          const optimalWidths = new Array(numCols).fill(400).map((_, index) => 
            calculateColumnWidth(index)
          );
          updates.columnWidths = optimalWidths;
        }
        if (needsRowUpdate) {
          updates.rowHeights = new Array(numRows).fill(32);
        }
        
        updateSheetState(updates);
      }
    }
  }, [slideContent, updateSheetState, calculateColumnWidth]);

  // Mouse event handlers - using useCallback with no dependencies to avoid stale closures
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const dragInfo = dragInfoRef.current;
    if (!dragInfo.type) return;
    
    e.preventDefault();
    
    const { type, index, startPos, startSize } = dragInfo;
    const currentPos = type === 'column' ? e.clientX : e.clientY;
    const rawDelta = currentPos - startPos;
    
    // Use very conservative incremental changes instead of raw mouse delta
    // This completely avoids the coordinate system issues
    let newSize = startSize;
    
    if (Math.abs(rawDelta) > 5) { // Only change if moved more than 5px
      const direction = rawDelta > 0 ? 1 : -1;
      const increment = type === 'column' ? 5 : 2; // Very small increments
      newSize = Math.max(
        type === 'column' ? 50 : 20, 
        Math.min(type === 'column' ? 300 : 150, startSize + (direction * increment))
      );
    }
    
    // Always log drag events for debugging
    console.log(`🖱️ INCREMENTAL DRAG: type=${type}, index=${index}, rawDelta=${rawDelta}, startSize=${startSize}, newSize=${newSize}`);
    
    // Get current state from ref (not stale closure)
    const currentState = currentStateRef.current;
    
    if (type === 'column') {
      const newWidths = [...currentState.columnWidths];
      newWidths[index] = newSize;
      const newState = { ...currentState, columnWidths: newWidths };
      setSheetState(newState);
      currentStateRef.current = newState;
    } else {
      const newHeights = [...currentState.rowHeights];
      newHeights[index] = newSize;
      const newState = { ...currentState, rowHeights: newHeights };
      setSheetState(newState);
      currentStateRef.current = newState;
    }
  }, []); // Empty deps to avoid stale closures

  const handleMouseUp = useCallback(() => {
    const dragInfo = dragInfoRef.current;
    if (dragInfo.type) {
      const finalState = currentStateRef.current;
      const finalSize = dragInfo.type === 'column' 
        ? finalState.columnWidths[dragInfo.index]
        : finalState.rowHeights[dragInfo.index];
      
      console.log(`🏁 DRAG END: type=${dragInfo.type}, index=${dragInfo.index}, finalSize=${finalSize}, startSize=${dragInfo.startSize}`);
      
      // Save the final state
      debouncedSave(finalState);
    }
    
    dragInfoRef.current = { type: null, index: -1, startPos: 0, startSize: 0 };
    setIsDragging(false);
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [handleMouseMove, debouncedSave]);

  const handleMouseDown = useCallback((type: 'column' | 'row', index: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    
    const currentState = currentStateRef.current;
    const startPos = type === 'column' ? e.clientX : e.clientY;
    const startSize = type === 'column' 
      ? (currentState.columnWidths[index] || 400)
      : (currentState.rowHeights[index] || 32);
    
    console.log(`🎯 DRAG START: type=${type}, index=${index}, startPos=${startPos}, startSize=${startSize}`);
    
    dragInfoRef.current = {
      type,
      index,
      startPos,
      startSize
    };
    
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = type === 'column' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  }, [handleMouseMove, handleMouseUp]);

  // Cleanup event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  // Preview control handlers
  const handlePreviewRowsChange = useCallback((rows: number) => {
    updateSheetState({ previewRows: rows });
    onPreviewChange(rows, currentStateRef.current.previewColumns);
  }, [updateSheetState, onPreviewChange]);

  const handlePreviewColumnsChange = useCallback((columns: number) => {
    updateSheetState({ previewColumns: columns });
    onPreviewChange(currentStateRef.current.previewRows, columns);
  }, [updateSheetState, onPreviewChange]);

  // Gridline control handlers
  const handleGridlinesChange = useCallback((showGridlines: boolean) => {
    const currentState = currentStateRef.current;
    updateSheetState({ 
      showGridlines,
      showHorizontalGridlines: showGridlines ? currentState.showHorizontalGridlines : false,
      showVerticalGridlines: showGridlines ? currentState.showVerticalGridlines : false
    });
  }, [updateSheetState]);

  const handleHorizontalGridlinesChange = useCallback((show: boolean) => {
    updateSheetState({ showHorizontalGridlines: show });
  }, [updateSheetState]);

  const handleVerticalGridlinesChange = useCallback((show: boolean) => {
    updateSheetState({ showVerticalGridlines: show });
  }, [updateSheetState]);

  const handleHeaderRowsChange = useCallback((headerRows: number) => {
    updateSheetState({ headerRows });
  }, [updateSheetState]);

  // Helper function to convert column index to Excel letter
  const getColumnLetter = useCallback((colIndex: number): string => {
    let result = '';
    while (colIndex >= 0) {
      result = String.fromCharCode(65 + (colIndex % 26)) + result;
      colIndex = Math.floor(colIndex / 26) - 1;
    }
    return result;
  }, []);

  // Helper function to check if cell is in custom range
  const isCellInRange = useCallback((rowIndex: number, colIndex: number): boolean => {
    if (!customRange) return true;
    
    try {
      // Parse start and end cells
      const startMatch = customRange.startCell.match(/^([A-Z]+)(\d+)$/i);
      const endMatch = customRange.endCell.match(/^([A-Z]+)(\d+)$/i);
      
      if (!startMatch || !endMatch) return true;
      
      const startCol = startMatch[1].toUpperCase();
      const startRow = parseInt(startMatch[2]);
      const endCol = endMatch[1].toUpperCase();
      const endRow = parseInt(endMatch[2]);
      
      // Convert column letters to indices
      const startColIndex = startCol.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
      const endColIndex = endCol.split('').reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
      
      const currentRow = rowIndex + 1; // Convert to 1-based
      const currentCol = colIndex;
      
      return currentRow >= startRow && currentRow <= endRow && 
             currentCol >= startColIndex && currentCol <= endColIndex;
    } catch {
      return true;
    }
  }, [customRange]);


  return (
    <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderTop: '4px solid #006FCF' }}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold" style={{ color: '#006FCF' }}>Slide Preview</h3>
        <div className="flex items-center space-x-4 flex-wrap">
          {/* Gridline Controls */}
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-1">
              <input
                type="checkbox"
                checked={sheetState.showGridlines}
                onChange={(e) => handleGridlinesChange(e.target.checked)}
                className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                style={{ 
                  accentColor: '#006FCF',
                  '--tw-ring-color': '#006FCF'
                } as any}
              />
              <span className="text-sm font-medium text-gray-700">Gridlines</span>
            </label>
          </div>
          
          {sheetState.showGridlines && (
            <>
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={sheetState.showHorizontalGridlines}
                    onChange={(e) => handleHorizontalGridlinesChange(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                style={{ 
                  accentColor: '#006FCF',
                  '--tw-ring-color': '#006FCF'
                } as any}
                  />
                  <span className="text-sm font-medium text-gray-700">Horizontal</span>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={sheetState.showVerticalGridlines}
                    onChange={(e) => handleVerticalGridlinesChange(e.target.checked)}
                    className="w-4 h-4 border-gray-300 rounded focus:ring-2"
                style={{ 
                  accentColor: '#006FCF',
                  '--tw-ring-color': '#006FCF'
                } as any}
                  />
                  <span className="text-sm font-medium text-gray-700">Vertical</span>
                </label>
              </div>
            </>
          )}

          {/* Header Rows Control */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Header Rows:</label>
            <input
              type="number"
              min="0"
              max="10"
              value={sheetState.headerRows}
              onChange={(e) => handleHeaderRowsChange(parseInt(e.target.value) || 0)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': '#006FCF' } as any}
            />
          </div>

          {/* Row/Column Count Controls */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Rows:</label>
            <input
              type="number"
              min="1"
              max="100"
              value={sheetState.previewRows}
              onChange={(e) => handlePreviewRowsChange(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': '#006FCF' } as any}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Columns:</label>
            <input
              type="number"
              min="1"
              max="50"
              value={sheetState.previewColumns}
              onChange={(e) => handlePreviewColumnsChange(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': '#006FCF' } as any}
            />
          </div>
        </div>
      </div>
      
      {slideContent.length > 0 ? (
        <>
          <div className="bg-gray-100 rounded-lg p-8 mb-4" style={{ aspectRatio: '16/9' }}>
            <div className="bg-white h-full rounded shadow-lg overflow-auto relative">
              {/* Excel-like table with headers */}
              <div className="relative">
                <table className="border-separate" style={{ tableLayout: 'fixed', borderSpacing: '0' }}>
                  {/* Column headers */}
                  <thead>
                    <tr>
                      {/* Empty corner cell */}
                      <th className="bg-gray-200 border border-gray-300 w-12 h-8 text-xs font-bold text-center sticky top-0 left-0 z-20">
                        
                      </th>
                      {/* Column letters */}
                      {slideContent[0]?.map((_, cellIndex) => (
                        <th 
                          key={cellIndex}
                          className="bg-gray-200 border border-gray-300 text-xs font-bold text-center sticky top-0 z-10"
                          style={{ width: `${sheetState.columnWidths[cellIndex] || 400}px`, height: '32px' }}
                        >
                          {getColumnLetter(cellIndex)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {slideContent.map((row, rowIndex) => (
                      <tr key={rowIndex} style={{ height: `${sheetState.rowHeights[rowIndex] || 32}px` }}>
                        {/* Row number */}
                        <td className="bg-gray-200 border border-gray-300 text-xs font-bold text-center sticky left-0 z-10" style={{ width: '48px' }}>
                          {rowIndex + 1}
                        </td>
                        {row.map((cell, cellIndex) => {
                          const bgColor = formatCellColor(cell.fill_color);
                          const textAlign = cell.alignment === 'center' ? 'center' : 
                                          cell.alignment === 'right' ? 'right' : 'left';
                          const inRange = isCellInRange(rowIndex, cellIndex);
                          const isHeaderRow = rowIndex < sheetState.headerRows;
                          // Check for colored background - exclude white, transparent, and undefined colors
                          const hasColoredBackground = !!(bgColor && 
                            bgColor !== '#ffffff' && 
                            bgColor !== '#FFFFFF' && 
                            bgColor !== 'rgb(255, 255, 255)' &&
                            bgColor !== 'rgb(255,255,255)' &&
                            bgColor !== '#fff' && 
                            bgColor !== '#FFF' &&
                            bgColor !== 'white' &&
                            bgColor !== 'transparent' &&
                            bgColor !== 'rgba(255, 255, 255, 1)' &&
                            bgColor !== 'rgba(255,255,255,1)' &&
                            bgColor !== '#fafafa' &&
                            bgColor !== '#f9f9f9');
                          
                          // Conditional gridlines: for header rows, only show gridlines around colored cells
                          // For non-header rows, show gridlines normally
                          const shouldShowGridlines = sheetState.showGridlines && (
                            !isHeaderRow || hasColoredBackground
                          );
                          
                          // Generate CSS classes for gridline control
                          let gridlineClass = 'excel-cell-no-borders'; // Default: no borders
                          
                          if (shouldShowGridlines) {
                            const showH = sheetState.showHorizontalGridlines;
                            const showV = sheetState.showVerticalGridlines;
                            
                            if (showH && showV) {
                              gridlineClass = 'excel-cell-both-borders';
                            } else if (showH) {
                              gridlineClass = 'excel-cell-horizontal-border';
                            } else if (showV) {
                              gridlineClass = 'excel-cell-vertical-border';
                            } else {
                              gridlineClass = 'excel-cell-no-borders';
                            }
                          }
                          
                          // Debug logging for header row gridlines
                          if (isHeaderRow) {
                            console.log(`🎨 HEADER Cell[${rowIndex},${cellIndex}]: 
                              bgColor="${bgColor}"
                              hasColoredBackground=${hasColoredBackground}
                              shouldShowGridlines=${shouldShowGridlines}
                              showGridlines=${sheetState.showGridlines}
                              showHorizontal=${sheetState.showHorizontalGridlines}
                              showVertical=${sheetState.showVerticalGridlines}
                              gridlineClass="${gridlineClass}"
                              cellValue="${cell.value}"`);
                          }
                          
                          return (
                            <td
                              key={cellIndex}
                              className={`relative px-2 py-1 overflow-hidden transition-opacity ${
                                inRange ? 'opacity-100' : 'opacity-30'
                              } ${isHeaderRow ? 'ring-1 ring-blue-200' : ''} ${gridlineClass}`}
                              style={{
                                width: `${sheetState.columnWidths[cellIndex] || 400}px`,
                                backgroundColor: inRange ? bgColor : '#f9f9f9',
                                fontWeight: cell.font_bold ? 'bold' : 'normal',
                                textAlign: textAlign as any,
                                fontSize: '12px',
                                ...(inRange && customRange ? {
                                  border: '2px solid #3b82f6',
                                  borderRadius: '2px',
                                  boxShadow: '0 0 0 1px #3b82f6',
                                } : {}),
                              }}
                            >
                              <div 
                                title={cell.value || ''}
                                style={{
                                  whiteSpace: 'nowrap',
                                  overflow: 'visible',
                                  textOverflow: 'clip',
                                  lineHeight: '1.2',
                                  minWidth: 'max-content',
                                  width: 'max-content'
                                }}
                              >
                                {cell.value || ''}
                              </div>
                              
                              {/* Improved column resize handle */}
                              {cellIndex < row.length - 1 && (
                                <div
                                  className={`absolute top-0 right-0 w-3 h-full cursor-col-resize hover:bg-blue-400 hover:bg-opacity-60 transition-colors ${
                                    isDragging && dragInfoRef.current.type === 'column' && dragInfoRef.current.index === cellIndex 
                                      ? 'bg-blue-500 bg-opacity-80' : ''
                                  }`}
                                  onMouseDown={(e) => handleMouseDown('column', cellIndex, e)}
                                  style={{ 
                                    transform: 'translateX(50%)',
                                    zIndex: 20
                                  }}
                                  title="Drag to resize column"
                                />
                              )}
                              
                              {/* Improved row resize handle */}
                              {rowIndex < slideContent.length - 1 && cellIndex === 0 && (
                                <div
                                  className={`absolute bottom-0 left-0 w-full h-3 cursor-row-resize hover:bg-blue-400 hover:bg-opacity-60 transition-colors ${
                                    isDragging && dragInfoRef.current.type === 'row' && dragInfoRef.current.index === rowIndex 
                                      ? 'bg-blue-500 bg-opacity-80' : ''
                                  }`}
                                  onMouseDown={(e) => handleMouseDown('row', rowIndex, e)}
                                  style={{ 
                                    transform: 'translateY(50%)',
                                    zIndex: 20
                                  }}
                                  title="Drag to resize row"
                                />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {slideCount > 1 && (
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => onSlideChange(Math.max(0, currentSlide - 1))}
                disabled={currentSlide === 0}
                className="px-4 py-2 text-white rounded-md disabled:bg-gray-300 hover:opacity-90 transition-all transform hover:scale-105"
                style={{ backgroundColor: '#006FCF' }}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Slide {currentSlide + 1} of {slideCount}
              </span>
              <button
                onClick={() => onSlideChange(Math.min(slideCount - 1, currentSlide + 1))}
                disabled={currentSlide === slideCount - 1}
                className="px-4 py-2 text-white rounded-md disabled:bg-gray-300 hover:opacity-90 transition-all transform hover:scale-105"
                style={{ backgroundColor: '#006FCF' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-100 rounded-lg p-8 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          <p className="text-gray-500">Select a table to preview</p>
        </div>
      )}
    </div>
  );
};