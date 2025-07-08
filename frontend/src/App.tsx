import React, { useState, useCallback, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { TableSelector } from './components/TableSelector';
import { FormatOptions } from './components/FormatOptions';
import { SlidePreview } from './components/SlidePreview';
import { 
  AnalysisResult, 
  ConversionOptions, 
  PreviewResponse 
} from './types';
import { analyzeExcel, previewSlide, convertToPptx } from './services/api';

const defaultOptions: ConversionOptions = {
  font_size: 12,
  font_family: 'Calibri',
  table_alignment: 'center',
  row_spacing: 1.5,
  column_spacing: 1.5,
  slide_orientation: 'horizontal',
  repeat_headers: true,
  auto_split: true,
  max_rows_per_slide: 20,
};

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [options, setOptions] = useState<ConversionOptions>(defaultOptions);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setLoading(true);
    setError(null);
    setAnalysisResult(null);
    setSelectedTableId(null);
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

  const handleTableSelect = useCallback((tableId: string) => {
    setSelectedTableId(tableId);
    setCurrentSlide(0);
  }, []);

  const handleOptionsChange = useCallback((newOptions: ConversionOptions) => {
    setOptions(newOptions);
  }, []);

  // Load preview when table or options change
  useEffect(() => {
    if (!analysisResult || !selectedTableId) return;

    const loadPreview = async () => {
      setLoading(true);
      setError(null);

      try {
        const previewResult = await previewSlide({
          file_id: analysisResult.file_id,
          table_id: selectedTableId,
          options,
        });
        setPreview(previewResult);
        setCurrentSlide(0);
      } catch (err) {
        setError('Failed to load preview. Please try again.');
        console.error('Preview error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [analysisResult, selectedTableId, options]);

  const handleDownload = useCallback(async () => {
    if (!analysisResult || !selectedTableId) return;

    setLoading(true);
    setError(null);

    try {
      const blob = await convertToPptx({
        file_id: analysisResult.file_id,
        table_id: selectedTableId,
        options,
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
  }, [analysisResult, selectedTableId, options, file]);

  const getCurrentSlideContent = (): string[][] => {
    if (!preview || preview.slide_content.length === 0) return [];
    
    // The preview.slide_content should be an array of slides, each containing rows
    // If it's a flat array, we need to handle it differently
    if (Array.isArray(preview.slide_content[0]) && Array.isArray(preview.slide_content[0][0])) {
      // It's already in the format [slide][row][cell]
      const multiSlideContent = preview.slide_content as string[][][];
      return multiSlideContent[currentSlide] || [];
    } else {
      // It's in the format [row][cell], so we show all content
      return preview.slide_content as string[][];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Excel to PowerPoint Converter
          </h1>
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
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Step 1: Upload Excel File</h2>
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
                tables: analysisResult.tables?.length,
                selectedTableId
              })}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <TableSelector
                    worksheets={analysisResult.worksheets || []}
                    tables={analysisResult.tables || []}
                    selectedTableId={selectedTableId}
                  onTableSelect={handleTableSelect}
                />
              </div>
              
              <div className="lg:col-span-1">
                <FormatOptions
                  options={options}
                  onChange={handleOptionsChange}
                />
              </div>
              
              <div className="lg:col-span-1">
                {selectedTableId && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Actions</h3>
                    <button
                      onClick={handleDownload}
                      disabled={loading || !preview}
                      className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Download PowerPoint
                    </button>
                  </div>
                )}
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
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;