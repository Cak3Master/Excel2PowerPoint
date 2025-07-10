import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { PlusIcon, XMarkIcon, DocumentIcon, TableCellsIcon, TagIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { DataSource, DataUpload, AgentResponse, DataSourceLabel, LabelSuggestion } from '../../types';
import { uploadDataSource, getLabels, suggestLabels, assignLabelToSource } from '../../services/api';

interface MultiSourceUploadProps {
  dataSources: DataSource[];
  onDataSourceAdded: (dataSource: DataSource) => void;
  onDataSourceRemoved: (sourceId: string) => void;
  maxSources?: number;
  allowedTypes?: string[];
}

export const MultiSourceUpload: React.FC<MultiSourceUploadProps> = ({
  dataSources = [],
  onDataSourceAdded,
  onDataSourceRemoved,
  maxSources = 5,
  allowedTypes = ['.xlsx', '.csv', '.json']
}) => {
  const [uploading, setUploading] = useState<Set<string>>(new Set());
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const [labels, setLabels] = useState<DataSourceLabel[]>([]);
  const [labelSuggestions, setLabelSuggestions] = useState<Record<string, LabelSuggestion[]>>({});
  const [showLabelDialog, setShowLabelDialog] = useState<string | null>(null);
  const [assigningLabel, setAssigningLabel] = useState<string | null>(null);

  useEffect(() => {
    loadLabels();
  }, []);

  const loadLabels = async () => {
    try {
      const response = await getLabels();
      if (response.success && response.data) {
        setLabels(response.data.labels);
      }
    } catch (error) {
      console.error('Failed to load labels:', error);
    }
  };

  const getSuggestionsForDataSource = async (dataSource: DataSource) => {
    try {
      const response = await suggestLabels({
        data_source_id: dataSource.id,
        columns: dataSource.metadata.columns
      });
      
      if (response.success && response.data) {
        setLabelSuggestions(prev => ({
          ...prev,
          [dataSource.id]: response.data.suggestions
        }));
      }
    } catch (error) {
      console.error('Failed to get label suggestions:', error);
    }
  };

  const handleAssignLabel = async (dataSourceId: string, labelId: string) => {
    setAssigningLabel(labelId);
    try {
      const dataSource = dataSources.find(ds => ds.id === dataSourceId);
      if (!dataSource) return;

      const label = labels.find(l => l.id === labelId);
      if (!label) return;

      // Create automatic column mapping (in a real app, this would be more sophisticated)
      const columnMapping: Record<string, string> = {};
      label.expected_columns.forEach(expectedCol => {
        const matchingCol = dataSource.metadata.columns.find(col => 
          col.toLowerCase().includes(expectedCol.toLowerCase()) ||
          expectedCol.toLowerCase().includes(col.toLowerCase())
        );
        if (matchingCol) {
          columnMapping[expectedCol] = matchingCol;
        }
      });

      const response = await assignLabelToSource(labelId, {
        data_source_id: dataSourceId,
        column_mapping: columnMapping
      });

      if (response.success) {
        // Update the data source with the new label assignment
        const updatedDataSource: DataSource = {
          ...dataSource,
          label_assignments: [...(dataSource.label_assignments || []), response.data]
        };
        onDataSourceAdded(updatedDataSource);
        
        setShowLabelDialog(null);
      } else {
        throw new Error(response.error || 'Failed to assign label');
      }
    } catch (error) {
      console.error('Failed to assign label:', error);
      alert('Failed to assign label. Please try again.');
    } finally {
      setAssigningLabel(null);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      if ((dataSources?.length || 0) >= maxSources) {
        alert(`Maximum ${maxSources} data sources allowed`);
        break;
      }

      const sourceId = uuidv4();
      const uploadId = `${sourceId}_${Date.now()}`;
      
      setUploading(prev => new Set(prev).add(uploadId));
      setUploadErrors(prev => ({ ...prev, [uploadId]: '' }));

      try {
        const dataUpload: DataUpload = {
          file,
          source_id: sourceId,
          source_name: file.name.replace(/\.[^/.]+$/, '') // Remove extension
        };

        const response: AgentResponse<DataSource> = await uploadDataSource(dataUpload);
        
        if (response.success && response.data) {
          onDataSourceAdded(response.data);
          // Get label suggestions for the uploaded data source
          getSuggestionsForDataSource(response.data);
        } else {
          setUploadErrors(prev => ({ 
            ...prev, 
            [uploadId]: response.error || 'Upload failed' 
          }));
        }
      } catch (error) {
        setUploadErrors(prev => ({ 
          ...prev, 
          [uploadId]: error instanceof Error ? error.message : 'Upload failed' 
        }));
      } finally {
        setUploading(prev => {
          const newSet = new Set(prev);
          newSet.delete(uploadId);
          return newSet;
        });
      }
    }
  }, [dataSources?.length || 0, maxSources, onDataSourceAdded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    multiple: true,
    disabled: (dataSources?.length || 0) >= maxSources
  });

  const removeDataSource = (sourceId: string) => {
    onDataSourceRemoved(sourceId);
  };

  const getFileIcon = (type: string) => {
    if (type === 'excel') return <TableCellsIcon className="h-5 w-5 text-green-600" />;
    return <DocumentIcon className="h-5 w-5 text-blue-600" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {(dataSources?.length || 0) < maxSources && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <input {...getInputProps()} />
          <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive ? (
              'Drop files here...'
            ) : (
              <>
                Drag & drop files here, or <span className="text-blue-600">click to browse</span>
              </>
            )}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Supported: {allowedTypes.join(', ')} (max {maxSources} files)
          </p>
        </div>
      )}

      {/* Data Sources List */}
      {(dataSources?.length || 0) > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-gray-900">
            Data Sources ({dataSources?.length || 0}/{maxSources})
          </h3>
          
          <div className="space-y-2">
            {dataSources.map((source) => (
              <div
                key={source.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white"
              >
                <div className="flex items-center space-x-3">
                  {getFileIcon(source.type)}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {source.name}
                    </h4>
                    <p className="text-xs text-gray-500">
                      {source.metadata?.row_count?.toLocaleString() || 0} rows × {source.metadata?.column_count || 0} columns
                      {source.metadata?.file_size && (
                        <> • {formatFileSize(source.metadata.file_size)}</>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {source.type.toUpperCase()}
                  </span>
                  
                  {/* Label Assignment Button */}
                  <button
                    onClick={() => {
                      setShowLabelDialog(source.id);
                      if (!labelSuggestions[source.id]) {
                        getSuggestionsForDataSource(source);
                      }
                    }}
                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    <TagIcon className="h-3 w-3 mr-1" />
                    {source.label_assignments?.length ? `${source.label_assignments.length} label${source.label_assignments.length > 1 ? 's' : ''}` : 'Add Label'}
                  </button>

                  <button
                    onClick={() => removeDataSource(source.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Progress */}
      {uploading.size > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploading...</h4>
          {Array.from(uploading).map(uploadId => (
            <div key={uploadId} className="flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
              </div>
              <span className="text-xs text-gray-500">Processing...</span>
            </div>
          ))}
        </div>
      )}

      {/* Upload Errors */}
      {Object.entries(uploadErrors).map(([uploadId, error]) => error && (
        <div key={uploadId} className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ))}

      {/* Help Text */}
      {(dataSources?.length || 0) === 0 && (
        <div className="text-center py-8">
          <TableCellsIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data sources</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload Excel, CSV, or JSON files to get started with data analysis.
          </p>
        </div>
      )}

      {/* Label Assignment Modal */}
      {showLabelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Assign Label to Data Source
              </h3>
              
              {/* Label Suggestions */}
              {labelSuggestions[showLabelDialog] && labelSuggestions[showLabelDialog].length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <SparklesIcon className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm font-medium text-gray-700">Suggestions</span>
                  </div>
                  <div className="space-y-2">
                    {labelSuggestions[showLabelDialog].map((suggestion) => (
                      <div
                        key={suggestion.label_id}
                        className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{ backgroundColor: labels.find(l => l.id === suggestion.label_id)?.color }}
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {suggestion.label_name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(suggestion.confidence * 100)}% match
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {suggestion.matching_columns.length} matching columns
                          </div>
                        </div>
                        <button
                          onClick={() => handleAssignLabel(showLabelDialog, suggestion.label_id)}
                          disabled={assigningLabel === suggestion.label_id}
                          className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                        >
                          {assigningLabel === suggestion.label_id ? 'Assigning...' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Labels */}
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-700 mb-2 block">All Labels</span>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className="flex items-center justify-between p-2 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full border border-gray-300"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {label.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {label.expected_columns.length} expected columns
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignLabel(showLabelDialog, label.id)}
                        disabled={assigningLabel === label.id}
                        className="ml-2 px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                      >
                        {assigningLabel === label.id ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLabelDialog(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};