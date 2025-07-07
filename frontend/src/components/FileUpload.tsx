import React, { useCallback } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center ${
        disabled ? 'border-gray-300 bg-gray-50' : 'border-blue-400 hover:border-blue-600'
      } transition-colors`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        stroke="currentColor"
        fill="none"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <path
          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <label
        htmlFor="file-upload"
        className={`mt-2 block text-sm font-medium ${
          disabled ? 'text-gray-500 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700 cursor-pointer'
        }`}
      >
        <span>Upload an Excel file or drag and drop</span>
        <input
          id="file-upload"
          name="file-upload"
          type="file"
          className="sr-only"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </label>
      <p className="mt-1 text-xs text-gray-500">XLSX or XLS files only</p>
    </div>
  );
};