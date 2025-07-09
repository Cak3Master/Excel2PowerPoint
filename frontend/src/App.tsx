import React, { useState, useCallback, useEffect } from 'react';
import { useAppStore } from './stores/appStore';
import { 
  HomeIcon,
  ChartBarIcon,
  TableCellsIcon,
  RocketLaunchIcon,
  ArrowDownTrayIcon,
  CloudArrowUpIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { FileUpload } from './components/FileUpload';
import { WorksheetSelector, WorksheetRange } from './components/WorksheetSelector';
import { FormatOptions } from './components/FormatOptions';
import { SlidePreview } from './components/SlidePreview';
import { MultiSourceUpload } from './components/upload/MultiSourceUpload';
import { VisualizationPage } from './components/visualization/VisualizationPage';
import { PivotPageEnhanced } from './components/pivot/PivotPageEnhanced';
import { PresetPage } from './components/presets/PresetPage';
import { ExportPage } from './components/export/ExportPage';
import { NotificationDisplay } from './components/common/NotificationDisplay';
import { 
  AnalysisResult, 
  ConversionOptions, 
  PreviewResponse,
  CellData,
  MultiWorksheetConvertRequest,
  DataSource
} from './types';
import { analyzeExcel, previewSlide, convertToPptx, convertMultiWorksheetToPptx } from './services/api';
import { 
  loadFormattingOptions, 
  saveFormattingOptions, 
  generateSheetKey,
  loadSheetState
} from './utils/localStorage';

type NavigationTab = 'legacy' | 'upload' | 'visualization' | 'pivot' | 'presets' | 'export';

function App() {
  // Legacy state for backward compatibility
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
  
  // New navigation state
  const [activeTab, setActiveTab] = useState<NavigationTab>('upload');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Use global store for data sources
  const { dataSources, addDataSource, removeDataSource } = useAppStore();
  
  // Multi-source upload handlers
  const handleDataSourceAdded = useCallback((dataSource: DataSource) => {
    addDataSource(dataSource);
  }, [addDataSource]);
  
  const handleDataSourceRemoved = useCallback((sourceId: string) => {
    removeDataSource(sourceId);
  }, [removeDataSource]);

  const navigationTabs = [
    { id: 'upload' as NavigationTab, name: 'Data Upload', icon: CloudArrowUpIcon },
    { id: 'visualization' as NavigationTab, name: 'Visualization', icon: ChartBarIcon },
    { id: 'pivot' as NavigationTab, name: 'Pivot Tables', icon: TableCellsIcon },
    { id: 'presets' as NavigationTab, name: 'Presets', icon: RocketLaunchIcon },
    { id: 'export' as NavigationTab, name: 'Export', icon: ArrowDownTrayIcon },
    { id: 'legacy' as NavigationTab, name: 'Legacy Mode', icon: HomeIcon }
  ];

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

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <MultiSourceUpload 
            dataSources={dataSources}
            onDataSourceAdded={handleDataSourceAdded}
            onDataSourceRemoved={handleDataSourceRemoved}
          />
        );
      case 'visualization':
        return <VisualizationPage />;
      case 'pivot':
        return <PivotPageEnhanced />;
      case 'presets':
        return <PresetPage />;
      case 'export':
        return <ExportPage />;
      case 'legacy':
        return (
          <div className="space-y-6">
            {/* Legacy File Upload */}
            <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderTop: '4px solid #006FCF' }}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: '#006FCF' }}>Step 1: Upload Excel File</h2>
              <FileUpload onFileSelect={handleFileSelect} disabled={loading} />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected file: {file.name}
                </p>
              )}
            </div>

            {/* Legacy Table Selection and Options */}
            {analysisResult && (
              <>
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

            {/* Legacy Preview */}
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
        );
      default:
        return (
          <MultiSourceUpload 
            dataSources={dataSources}
            onDataSourceAdded={handleDataSourceAdded}
            onDataSourceRemoved={handleDataSourceRemoved}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="text-blue-600 font-bold text-lg">AmEx Analytics</div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigationTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="mr-4 h-6 w-6" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <div className="text-blue-600 font-bold text-xl">AmEx Analytics</div>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigationTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <tab.icon className="mr-3 h-5 w-5" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600">{error}</p>
                </div>
              )}

              {/* Loading Overlay */}
              {loading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Processing...</p>
                  </div>
                </div>
              )}

              {/* Content */}
              {renderContent()}
            </div>
          </div>
        </main>
      </div>

      {/* Notification Display */}
      <NotificationDisplay />
    </div>
  );
}

export default App;