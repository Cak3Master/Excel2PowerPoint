import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  DocumentTextIcon,
  PresentationChartBarIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { ExportConfiguration, ExportTemplate } from '../../types';

interface ExportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (config: ExportConfiguration) => void;
  availableData?: {
    charts: Array<{ id: string; name: string; type: string }>;
    pivotTables: Array<{ id: string; name: string; rows: number; columns: number }>;
    dataSources: Array<{ id: string; name: string; type: string }>;
  };
}

export const ExportWizard: React.FC<ExportWizardProps> = ({
  isOpen,
  onClose,
  onExport,
  availableData
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [config, setConfig] = useState<any>({
    name: 'export_config',
    format: 'excel',
    template: 'default',
    data_sources: [],
    content: {
      include_data: true,
      include_charts: true,
      include_summary: true,
      include_pivot_tables: true,
      include_raw_data: false,
      selected_items: []
    },
    formatting: {
      template: 'default',
      theme: 'corporate',
      font_family: 'Arial',
      font_size: 12,
      include_headers: true,
      include_footers: false
    },
    output: {
      filename: 'export_output',
      quality: 'high',
      compression: false,
      password_protect: false,
    }
  });

  const steps = [
    { id: 1, name: 'Format & Template', icon: DocumentTextIcon },
    { id: 2, name: 'Content Selection', icon: Cog6ToothIcon },
    { id: 3, name: 'Formatting Options', icon: PresentationChartBarIcon },
    { id: 4, name: 'Output Settings', icon: ArrowDownTrayIcon }
  ];

  const templates: any[] = [
    {
      id: 'default',
      name: 'Default',
      description: 'Standard layout with basic formatting',
      preview_url: '',
      format_support: ['excel', 'powerpoint'],
      type: 'corporate',
      colors: { primary: '#3B82F6', secondary: '#EF4444', accent: '#10B981' },
      fonts: { primary: 'Arial', secondary: 'Helvetica' },
      layouts: ['single-column', 'two-column'],
      features: { branding: true, custom_master: false, layout_count: 2 }
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Professional layout with company branding',
      preview_url: '',
      format_support: ['excel', 'powerpoint'],
      type: 'corporate',
      colors: { primary: '#1E40AF', secondary: '#DC2626', accent: '#059669' },
      fonts: { primary: 'Arial', secondary: 'Calibri' },
      layouts: ['branded', 'executive'],
      features: { branding: true, custom_master: true, layout_count: 3 }
    },
    {
      id: 'minimal',
      name: 'Minimal',
      description: 'Clean, minimal design with essential elements',
      preview_url: '',
      format_support: ['excel', 'powerpoint'],
      type: 'minimal',
      colors: { primary: '#374151', secondary: '#6B7280', accent: '#9CA3AF' },
      fonts: { primary: 'Helvetica', secondary: 'Arial' },
      layouts: ['clean', 'simple'],
      features: { branding: false, custom_master: false, layout_count: 1 }
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Multi-panel layout for comprehensive reports',
      preview_url: '',
      format_support: ['powerpoint'],
      type: 'corporate',
      colors: { primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' },
      fonts: { primary: 'Arial', secondary: 'Segoe UI' },
      layouts: ['dashboard', 'multi-panel'],
      features: { branding: true, custom_master: true, layout_count: 4 }
    }
  ];

  const themes = [
    { id: 'corporate', name: 'Corporate', colors: ['#1E40AF', '#DC2626', '#059669'] },
    { id: 'modern', name: 'Modern', colors: ['#3B82F6', '#EF4444', '#10B981'] },
    { id: 'minimal', name: 'Minimal', colors: ['#374151', '#6B7280', '#9CA3AF'] },
    { id: 'vibrant', name: 'Vibrant', colors: ['#8B5CF6', '#F59E0B', '#EC4899'] }
  ];

  const updateConfig = (section: any, updates: any) => {
    setConfig((prev: any) => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        ...updates
      }
    }));
  };

  const toggleContentItem = (type: string, id: string) => {
    setConfig((prev: any) => {
      const selected = prev.content.selected_items || [];
      const itemKey = `${type}:${id}`;
      const exists = selected.includes(itemKey);
      
      const newSelected = exists
        ? selected.filter((item: string) => item !== itemKey)
        : [...selected, itemKey];
      
      return {
        ...prev,
        content: {
          ...prev.content,
          selected_items: newSelected
        }
      };
    });
  };

  const isContentItemSelected = (type: string, id: string) => {
    const itemKey = `${type}:${id}`;
    return config.content.selected_items?.includes(itemKey) || false;
  };

  const getAvailableTemplates = () => {
    return templates.filter(template => 
      template.format_support.includes(config.format)
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return config.format && config.template;
      case 2:
        return config.content.selected_items?.length > 0 || 
               config.content.include_charts || 
               config.content.include_pivot_tables || 
               config.content.include_raw_data;
      case 3:
        return config.formatting.theme && config.formatting.font_family;
      case 4:
        return config.output.filename;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    onExport(config);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Export Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        currentStep === step.id
                          ? 'bg-blue-600 text-white'
                          : currentStep > step.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircleIcon className="h-5 w-5" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <div className="ml-3">
                      <div className={`text-sm font-medium ${
                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.name}
                      </div>
                    </div>
                    {stepIdx !== steps.length - 1 && (
                      <div className="flex-1 ml-4 border-t-2 border-gray-300" />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 min-h-96 max-h-96 overflow-y-auto">
          {/* Step 1: Format & Template */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Export Format</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, format: 'excel' }))}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      config.format === 'excel'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DocumentTextIcon className="h-8 w-8 text-green-600 mb-2" />
                    <h4 className="font-medium text-gray-900">Excel (.xlsx)</h4>
                    <p className="text-sm text-gray-500">Spreadsheet format with data tables and charts</p>
                  </button>
                  
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, format: 'powerpoint' }))}
                    className={`p-4 border-2 rounded-lg text-left transition-colors ${
                      config.format === 'powerpoint'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <PresentationChartBarIcon className="h-8 w-8 text-orange-600 mb-2" />
                    <h4 className="font-medium text-gray-900">PowerPoint (.pptx)</h4>
                    <p className="text-sm text-gray-500">Presentation format with slides and visualizations</p>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Select Template</h3>
                <div className="grid grid-cols-2 gap-4">
                  {getAvailableTemplates().map((template) => (
                    <button
                      key={template.id}
                      onClick={() => setConfig(prev => ({ ...prev, template: template.id }))}
                      className={`p-4 border-2 rounded-lg text-left transition-colors ${
                        config.template === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Content Selection */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Select Content to Include</h3>
              
              {/* Content Type Toggles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Charts</h4>
                    <p className="text-sm text-gray-500">Include all created charts and visualizations</p>
                  </div>
                  <button
                    onClick={() => updateConfig('content', { include_charts: !config.content.include_charts })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.content.include_charts ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.content.include_charts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Pivot Tables</h4>
                    <p className="text-sm text-gray-500">Include all created pivot tables</p>
                  </div>
                  <button
                    onClick={() => updateConfig('content', { include_pivot_tables: !config.content.include_pivot_tables })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.content.include_pivot_tables ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.content.include_pivot_tables ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Raw Data</h4>
                    <p className="text-sm text-gray-500">Include original data sources as sheets/slides</p>
                  </div>
                  <button
                    onClick={() => updateConfig('content', { include_raw_data: !config.content.include_raw_data })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.content.include_raw_data ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.content.include_raw_data ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Specific Content Selection */}
              {availableData && (
                <div className="space-y-4">
                  {/* Charts */}
                  {availableData.charts.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Available Charts</h4>
                      <div className="space-y-2">
                        {availableData.charts.map((chart) => (
                          <div key={chart.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                            <div>
                              <span className="font-medium">{chart.name}</span>
                              <span className="ml-2 text-sm text-gray-500">({chart.type})</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isContentItemSelected('chart', chart.id)}
                              onChange={() => toggleContentItem('chart', chart.id)}
                              className="rounded border-gray-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pivot Tables */}
                  {availableData.pivotTables.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Available Pivot Tables</h4>
                      <div className="space-y-2">
                        {availableData.pivotTables.map((pivot) => (
                          <div key={pivot.id} className="flex items-center justify-between p-2 border border-gray-200 rounded">
                            <div>
                              <span className="font-medium">{pivot.name}</span>
                              <span className="ml-2 text-sm text-gray-500">({pivot.rows}×{pivot.columns})</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isContentItemSelected('pivot', pivot.id)}
                              onChange={() => toggleContentItem('pivot', pivot.id)}
                              className="rounded border-gray-300"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Formatting Options */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Formatting Options</h3>
              
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Color Theme</label>
                <div className="grid grid-cols-2 gap-3">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => updateConfig('formatting', { theme: theme.id })}
                      className={`p-3 border-2 rounded-lg transition-colors ${
                        config.formatting.theme === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        {theme.colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{theme.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
                  <select
                    value={config.formatting.font_family}
                    onChange={(e) => updateConfig('formatting', { font_family: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="Arial">Arial</option>
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Calibri">Calibri</option>
                    <option value="Georgia">Georgia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
                  <input
                    type="number"
                    min="8"
                    max="24"
                    value={config.formatting.font_size}
                    onChange={(e) => updateConfig('formatting', { font_size: parseInt(e.target.value) })}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Additional Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Include Headers</span>
                  <button
                    onClick={() => updateConfig('formatting', { include_headers: !config.formatting.include_headers })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.formatting.include_headers ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.formatting.include_headers ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Include Footers</span>
                  <button
                    onClick={() => updateConfig('formatting', { include_footers: !config.formatting.include_footers })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.formatting.include_footers ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.formatting.include_footers ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Output Settings */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Output Settings</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filename</label>
                <input
                  type="text"
                  value={config.output.filename}
                  onChange={(e) => updateConfig('output', { filename: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Enter filename"
                />
                <p className="text-xs text-gray-500 mt-1">
                  File extension will be added automatically based on format
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Enable Compression</span>
                    <p className="text-xs text-gray-500">Reduce file size for faster downloads</p>
                  </div>
                  <button
                    onClick={() => updateConfig('output', { compression: !config.output.compression })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.output.compression ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.output.compression ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Password Protection</span>
                    <p className="text-xs text-gray-500">Secure the file with a password</p>
                  </div>
                  <button
                    onClick={() => updateConfig('output', { password_protect: !config.output.password_protect })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      config.output.password_protect ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        config.output.password_protect ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {config.output.password_protect && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={(config.output as any).password || ''}
                    onChange={(e) => updateConfig('output', { password: e.target.value })}
                    className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Enter password"
                  />
                </div>
              )}

              {/* Configuration Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Format: {config.format.toUpperCase()}</div>
                  <div>Template: {config.template}</div>
                  <div>Theme: {config.formatting.theme}</div>
                  <div>Content items: {config.content.selected_items?.length || 0}</div>
                  <div>Filename: {config.output.filename}.{config.format === 'excel' ? 'xlsx' : 'pptx'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex space-x-2">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                <ChevronLeftIcon className="h-4 w-4 mr-2" />
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRightIcon className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canProceed()}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};