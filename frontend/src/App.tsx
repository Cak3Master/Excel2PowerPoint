import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { WorksheetSelector, WorksheetRange } from './components/WorksheetSelector';
import { FormatOptions } from './components/FormatOptions';
import { SlidePreview } from './components/SlidePreview';
import { 
  AnalysisResult, 
  ConversionOptions, 
  PreviewResponse,
  CellData,
  MultiWorksheetConvertRequest
} from './types';
import { analyzeExcel, previewSlide, convertToPptx, convertMultiWorksheetToPptx } from './services/api';
import { 
  loadFormattingOptions, 
  saveFormattingOptions, 
  generateSheetKey,
  loadSheetState
} from './utils/localStorage';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string | null>(null);
  const [worksheetRanges, setWorksheetRanges] = useState<WorksheetRange[]>([]);
  const [options, setOptions] = useState<ConversionOptions>(() => loadFormattingOptions());
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSheetKey, setCurrentSheetKey] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setSelectedWorksheet(null);
    setWorksheetRanges([]);
    setPreview(null);

    try {
      console.log('Starting file analysis for:', selectedFile.name);
      const result = await analyzeExcel(selectedFile);
      console.log('Analysis result:', result);
      
      // Validate the result structure
      if (!result || !result.file_id) {
        throw new Error('Invalid response from server');
      }
      
      setAnalysisResult(result);
      console.log('Analysis result set successfully');
    } catch (err) {
      console.error('Analysis error:', err);
      setError(`Failed to analyze Excel file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  }, []);

  const handleWorksheetSelect = useCallback((worksheetName: string) => {
    setSelectedWorksheet(worksheetName);
    setCurrentSlide(0);
    if (analysisResult) {
      const sheetKey = generateSheetKey(analysisResult.file_id, `worksheet_${worksheetName}`);
      setCurrentSheetKey(sheetKey);
    }
  }, [analysisResult]);

  const handleRangeUpdate = useCallback((ranges: WorksheetRange[]) => {
    setWorksheetRanges(ranges);
  }, []);

  const handleOptionsChange = useCallback((newOptions: ConversionOptions) => {
    setOptions(newOptions);
    saveFormattingOptions(newOptions);
  }, []);

  // Function to load preview - can be called by SlidePreview component
  const loadPreview = useCallback(async (previewRows: number, previewColumns: number) => {
    if (!analysisResult || !selectedWorksheet) return;

    setLoading(true);
    setError(null);

    try {
      const previewResult = await previewSlide({
        file_id: analysisResult.file_id,
        table_id: `worksheet_${selectedWorksheet}`,
        options,
        preview_rows: previewRows,
        preview_columns: previewColumns,
      });
      setPreview(previewResult);
      setCurrentSlide(0);
    } catch (err) {
      setError('Failed to load preview. Please try again.');
      console.error('Preview error:', err);
    } finally {
      setLoading(false);
    }
  }, [analysisResult, selectedWorksheet, options]);

  // Load preview when table or options change (with default values)
  useEffect(() => {
    if (!analysisResult || !selectedWorksheet) return;
    loadPreview(50, 20); // Default values
  }, [analysisResult, selectedWorksheet, options, loadPreview]);

  const handleDownload = useCallback(async () => {
    if (!analysisResult || worksheetRanges.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      // Filter to only included ranges
      const includedRanges = worksheetRanges.filter(range => range.includeInDownload);
      
      if (includedRanges.length === 0) {
        setError('No worksheets selected for download. Please select at least one worksheet.');
        return;
      }

      // Load sheet-specific settings for the selected worksheet
      const sheetKey = selectedWorksheet ? generateSheetKey(analysisResult.file_id, `worksheet_${selectedWorksheet}`) : null;
      const sheetState = sheetKey ? loadSheetState(sheetKey) : null;
      
      const downloadOptions = {
        ...options,
        column_widths: sheetState?.columnWidths || [],
        row_heights: sheetState?.rowHeights || [],
        show_gridlines: sheetState?.showGridlines ?? true,
        show_horizontal_gridlines: sheetState?.showHorizontalGridlines ?? true,
        show_vertical_gridlines: sheetState?.showVerticalGridlines ?? true,
        preview_rows: sheetState?.previewRows || 50,
        preview_columns: sheetState?.previewColumns || 20,
        header_rows: sheetState?.headerRows || 1,
      };
      
      // Use the new multi-worksheet conversion API
      const blob = await convertMultiWorksheetToPptx({
        file_id: analysisResult.file_id,
        worksheet_ranges: includedRanges,
        options: downloadOptions,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file?.name.replace(/\.[^/.]+$/, '')}_converted.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to convert file. Please try again.');
      console.error('Conversion error:', err);
    } finally {
      setLoading(false);
    }
  }, [analysisResult, worksheetRanges, selectedWorksheet, options, file]);

  const getCurrentSlideContent = (): CellData[][] => {
    if (!preview || preview.slide_content.length === 0) return [];
    
    // The preview.slide_content should be an array of slides, each containing rows
    // If it's a flat array, we need to handle it differently
    if (Array.isArray(preview.slide_content[0]) && Array.isArray(preview.slide_content[0][0])) {
      // It's already in the format [slide][row][cell]
      const multiSlideContent = preview.slide_content as CellData[][][];
      return multiSlideContent[currentSlide] || [];
    } else {
      // It's in the format [row][cell], so we show all content
      return preview.slide_content as CellData[][];
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f8fa' }}>
      <header className="shadow-lg" style={{ backgroundColor: '#006FCF' }}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="text-white font-bold text-lg">AmEx</div>
            </div>
            <h1 className="text-3xl font-bold text-white">
              Excel to PowerPoint Converter
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Processing...</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* File Upload */}
          <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderTop: '4px solid #006FCF' }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#006FCF' }}>Step 1: Upload Excel File</h2>
            <FileUpload onFileSelect={handleFileSelect} disabled={loading} />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected file: {file.name}
              </p>
            )}
          </div>

          {/* Table Selection and Options */}
          {analysisResult && (
            <>
              {console.log('Rendering analysis result:', {
                worksheets: analysisResult.worksheets?.length,
                selectedWorksheet,
                worksheetRanges: worksheetRanges.length
              })}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <WorksheetSelector
                    worksheets={analysisResult.worksheets || []}
                    selectedWorksheet={selectedWorksheet}
                    onWorksheetSelect={handleWorksheetSelect}
                    worksheetRanges={worksheetRanges}
                    onRangeUpdate={handleRangeUpdate}
                  />
                </div>
              
              <div className="lg:col-span-1">
                <FormatOptions
                  options={options}
                  onChange={handleOptionsChange}
                />
              </div>
              
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderTop: '4px solid #006FCF' }}>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: '#006FCF' }}>Actions</h3>
                  <button
                    onClick={handleDownload}
                    disabled={loading || worksheetRanges.filter(r => r.includeInDownload).length === 0}
                    className="w-full px-4 py-2 text-white rounded-md hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all transform hover:scale-105"
                    style={{ backgroundColor: '#006FCF' }}
                  >
                    Download PowerPoint
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    {worksheetRanges.filter(r => r.includeInDownload).length} worksheet(s) selected
                  </p>
                </div>
              </div>
            </div>
            </>
          )}

          {/* Preview */}
          {preview && (
            <SlidePreview
              slideContent={getCurrentSlideContent()}
              slideCount={preview.slide_count}
              currentSlide={currentSlide}
              onSlideChange={setCurrentSlide}
              sheetKey={currentSheetKey}
              onPreviewChange={loadPreview}
              customRange={selectedWorksheet ? worksheetRanges.find(r => r.worksheetName === selectedWorksheet) : null}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;