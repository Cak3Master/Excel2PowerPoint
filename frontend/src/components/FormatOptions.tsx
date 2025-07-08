import React from 'react';
import { ConversionOptions } from '../types';

interface FormatOptionsProps {
  options: ConversionOptions;
  onChange: (options: ConversionOptions) => void;
}

export const FormatOptions: React.FC<FormatOptionsProps> = ({ options, onChange }) => {
  const handleChange = <K extends keyof ConversionOptions>(
    key: K,
    value: ConversionOptions[K]
  ) => {
    onChange({ ...options, [key]: value });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6" style={{ borderTop: '4px solid #006FCF' }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: '#006FCF' }}>Formatting Options</h3>
      
      <div className="space-y-4">
        {/* Font Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Size
          </label>
          <input
            type="number"
            min="8"
            max="72"
            value={options.font_size}
            onChange={(e) => handleChange('font_size', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#006FCF' } as any}
          />
        </div>

        {/* Font Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Font Family
          </label>
          <select
            value={options.font_family}
            onChange={(e) => handleChange('font_family', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#006FCF' } as any}
          >
            <option value="Calibri">Calibri</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Georgia">Georgia</option>
          </select>
        </div>

        {/* Table Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Table Alignment
          </label>
          <select
            value={options.table_alignment}
            onChange={(e) => handleChange('table_alignment', e.target.value as 'center' | 'left' | 'right')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#006FCF' } as any}
          >
            <option value="center">Center</option>
            <option value="left">Left</option>
            <option value="right">Right</option>
          </select>
        </div>

        {/* Row Spacing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Row Spacing (pt)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={options.row_spacing}
            onChange={(e) => handleChange('row_spacing', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#006FCF' } as any}
          />
        </div>

        {/* Column Spacing */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Column Spacing (pt)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={options.column_spacing}
            onChange={(e) => handleChange('column_spacing', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#006FCF' } as any}
          />
        </div>

        {/* Slide Orientation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slide Orientation
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="horizontal"
                checked={options.slide_orientation === 'horizontal'}
                onChange={(e) => handleChange('slide_orientation', e.target.value as 'horizontal' | 'vertical')}
                className="mr-2"
              />
              Horizontal
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="vertical"
                checked={options.slide_orientation === 'vertical'}
                onChange={(e) => handleChange('slide_orientation', e.target.value as 'horizontal' | 'vertical')}
                className="mr-2"
              />
              Vertical
            </label>
          </div>
        </div>

        {/* Repeat Headers */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.repeat_headers}
              onChange={(e) => handleChange('repeat_headers', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Repeat headers on each slide
            </span>
          </label>
        </div>

        {/* Auto Split */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={options.auto_split}
              onChange={(e) => handleChange('auto_split', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Auto-split large tables (vs. shrink to fit)
            </span>
          </label>
        </div>
      </div>
    </div>
  );
};