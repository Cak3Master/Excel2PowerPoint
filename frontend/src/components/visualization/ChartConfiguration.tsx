import React, { useState, useEffect } from 'react';
import { 
  SwatchIcon, 
  AdjustmentsHorizontalIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { ChartConfiguration as ChartConfig, ChartRecommendation, DataAnalysisResult } from '../../types';

interface ChartConfigurationProps {
  recommendation: ChartRecommendation;
  analysisResult: DataAnalysisResult;
  onConfigurationChange: (config: ChartConfig) => void;
  onPreview: () => void;
  onExport: () => void;
}

export const ChartConfiguration: React.FC<ChartConfigurationProps> = ({
  recommendation,
  analysisResult,
  onConfigurationChange,
  onPreview,
  onExport
}) => {
  const [config, setConfig] = useState<ChartConfig>({
    chart_type: recommendation.chart_type,
    title: recommendation.title,
    data_mapping: recommendation.data_mapping,
    styling: {
      theme: 'default',
      colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'],
      font_size: 12
    },
    interactivity: {
      zoom: false,
      hover: true,
      click: false
    },
    layout: {
      width: 800,
      height: 600,
      margin: { top: 20, right: 30, bottom: 40, left: 50 }
    }
  });

  const [activeTab, setActiveTab] = useState<'data' | 'styling' | 'interactivity' | 'layout'>('data');

  useEffect(() => {
    onConfigurationChange(config);
  }, [config, onConfigurationChange]);

  const updateConfig = (section: keyof ChartConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...((prev as any)[section] || {}),
        ...updates
      }
    }));
  };

  const availableColumns = analysisResult.columns;
  const numericColumns = availableColumns.filter(c => 
    c.type.includes('int') || c.type.includes('float')
  );
  const categoricalColumns = availableColumns.filter(c => 
    !c.type.includes('int') && !c.type.includes('float')
  );
  const dateColumns = availableColumns.filter(c => 
    c.type.includes('datetime') || c.name.toLowerCase().includes('date')
  );

  const themes = [
    { id: 'default', name: 'Default', colors: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'] },
    { id: 'corporate', name: 'Corporate', colors: ['#1E40AF', '#DC2626', '#059669', '#D97706', '#7C3AED'] },
    { id: 'pastel', name: 'Pastel', colors: ['#93C5FD', '#FCA5A5', '#6EE7B7', '#FDE68A', '#C4B5FD'] },
    { id: 'dark', name: 'Dark', colors: ['#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF'] },
    { id: 'earth', name: 'Earth', colors: ['#92400E', '#059669', '#D97706', '#7C2D12', '#365314'] }
  ];

  const tabs = [
    { id: 'data' as const, name: 'Data Mapping', icon: SparklesIcon },
    { id: 'styling' as const, name: 'Styling', icon: SwatchIcon },
    { id: 'interactivity' as const, name: 'Interactivity', icon: AdjustmentsHorizontalIcon },
    { id: 'layout' as const, name: 'Layout', icon: AdjustmentsHorizontalIcon }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Chart Configuration</h3>
            <p className="text-sm text-gray-500 mt-1">
              {recommendation.chart_type.charAt(0).toUpperCase() + recommendation.chart_type.slice(1)} Chart
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={onPreview}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <EyeIcon className="h-4 w-4 mr-2" />
              Preview
            </button>
            <button
              onClick={onExport}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <tab.icon className="h-4 w-4 mr-2" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'data' && (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chart Title
              </label>
              <input
                type="text"
                value={config.title || ''}
                onChange={(e) => setConfig(prev => ({ ...prev, title: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                placeholder="Enter chart title"
              />
            </div>

            {/* X-Axis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X-Axis
              </label>
              <select
                value={config.data_mapping.x || ''}
                onChange={(e) => updateConfig('data_mapping', { x: e.target.value })}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select column...</option>
                <optgroup label="Categorical">
                  {categoricalColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Numeric">
                  {numericColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Date/Time">
                  {dateColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Y-Axis */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Y-Axis
              </label>
              <select
                value={config.data_mapping.y || ''}
                onChange={(e) => updateConfig('data_mapping', { y: e.target.value })}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select column...</option>
                <optgroup label="Numeric">
                  {numericColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Series (for grouped charts) */}
            {(config.chart_type === 'stacked_bar' || config.chart_type === 'line') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Series (Optional)
                </label>
                <select
                  value={config.data_mapping.series || ''}
                  onChange={(e) => updateConfig('data_mapping', { series: e.target.value })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">No grouping</option>
                  {categoricalColumns.map(col => (
                    <option key={col.name} value={col.name}>{col.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {activeTab === 'styling' && (
          <div className="space-y-6">
            {/* Theme Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Color Theme
              </label>
              <div className="grid grid-cols-5 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => updateConfig('styling', { 
                      theme: theme.id, 
                      colors: theme.colors 
                    })}
                    className={`
                      p-3 border-2 rounded-lg text-center transition-colors
                      ${config.styling?.theme === theme.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex space-x-1 mb-2">
                      {theme.colors.slice(0, 3).map((color, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-medium">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <input
                type="range"
                min="8"
                max="24"
                value={config.styling?.font_size || 12}
                onChange={(e) => updateConfig('styling', { font_size: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>8px</span>
                <span className="font-medium">{config.styling?.font_size || 12}px</span>
                <span>24px</span>
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Custom Colors
              </label>
              <div className="flex space-x-2">
                {(config.styling?.colors || []).map((color, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...(config.styling?.colors || [])];
                        newColors[index] = e.target.value;
                        updateConfig('styling', { colors: newColors });
                      }}
                      className="w-8 h-8 rounded border border-gray-300"
                    />
                    <span className="text-xs text-gray-500 mt-1">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'interactivity' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Enable Hover Effects</h4>
                  <p className="text-xs text-gray-500">Show details when hovering over chart elements</p>
                </div>
                <button
                  onClick={() => updateConfig('interactivity', { 
                    hover: !config.interactivity?.hover 
                  })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${config.interactivity?.hover ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${config.interactivity?.hover ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Enable Zoom</h4>
                  <p className="text-xs text-gray-500">Allow users to zoom into chart areas</p>
                </div>
                <button
                  onClick={() => updateConfig('interactivity', { 
                    zoom: !config.interactivity?.zoom 
                  })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${config.interactivity?.zoom ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${config.interactivity?.zoom ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-700">Enable Click Events</h4>
                  <p className="text-xs text-gray-500">Allow clicking on chart elements for details</p>
                </div>
                <button
                  onClick={() => updateConfig('interactivity', { 
                    click: !config.interactivity?.click 
                  })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${config.interactivity?.click ? 'bg-blue-600' : 'bg-gray-200'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${config.interactivity?.click ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'layout' && (
          <div className="space-y-6">
            {/* Dimensions */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="300"
                  max="1200"
                  value={config.layout?.width || 800}
                  onChange={(e) => updateConfig('layout', { width: parseInt(e.target.value) })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="200"
                  max="800"
                  value={config.layout?.height || 600}
                  onChange={(e) => updateConfig('layout', { height: parseInt(e.target.value) })}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>

            {/* Margins */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Margins
              </label>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Top</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.layout?.margin?.top || 20}
                    onChange={(e) => updateConfig('layout', { 
                      margin: { 
                        ...config.layout?.margin, 
                        top: parseInt(e.target.value) 
                      } 
                    })}
                    className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Right</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.layout?.margin?.right || 30}
                    onChange={(e) => updateConfig('layout', { 
                      margin: { 
                        ...config.layout?.margin, 
                        right: parseInt(e.target.value) 
                      } 
                    })}
                    className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Bottom</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.layout?.margin?.bottom || 40}
                    onChange={(e) => updateConfig('layout', { 
                      margin: { 
                        ...config.layout?.margin, 
                        bottom: parseInt(e.target.value) 
                      } 
                    })}
                    className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Left</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.layout?.margin?.left || 50}
                    onChange={(e) => updateConfig('layout', { 
                      margin: { 
                        ...config.layout?.margin, 
                        left: parseInt(e.target.value) 
                      } 
                    })}
                    className="block w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};