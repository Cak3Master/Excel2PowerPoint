import React, { useState, useEffect, useCallback } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  TagIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { DataSourceLabel, AgentResponse } from '../../types';
import { useNotificationStore } from '../../stores/appStore';

interface LabelManagerProps {
  onLabelCreated?: (label: DataSourceLabel) => void;
  onLabelUpdated?: (label: DataSourceLabel) => void;
  onLabelDeleted?: (labelId: string) => void;
  selectedLabelId?: string;
  onLabelSelect?: (label: DataSourceLabel) => void;
}

export const LabelManager: React.FC<LabelManagerProps> = ({
  onLabelCreated,
  onLabelUpdated,
  onLabelDeleted,
  selectedLabelId,
  onLabelSelect
}) => {
  const { addNotification } = useNotificationStore();
  const [labels, setLabels] = useState<DataSourceLabel[]>([]);
  const [filteredLabels, setFilteredLabels] = useState<DataSourceLabel[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingLabel, setEditingLabel] = useState<DataSourceLabel | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);

  useEffect(() => {
    loadLabels();
  }, [loadLabels]);

  useEffect(() => {
    filterLabels();
  }, [labels, searchTerm, filterLabels]);

  const loadLabels = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/labels');
      const data: AgentResponse<{ labels: DataSourceLabel[] }> = await response.json();
      
      if (data.success && data.data) {
        setLabels(data.data.labels);
      } else {
        throw new Error(data.error || 'Failed to load labels');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error Loading Labels',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const filterLabels = useCallback(() => {
    if (!searchTerm.trim()) {
      setFilteredLabels(labels);
    } else {
      const filtered = labels.filter(label => 
        label.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        label.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        label.expected_columns.some(col => col.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredLabels(filtered);
    }
  }, [labels, searchTerm]);

  const handleCreateLabel = () => {
    setEditingLabel(null);
    setIsEditorOpen(true);
  };

  const handleEditLabel = (label: DataSourceLabel) => {
    setEditingLabel(label);
    setIsEditorOpen(true);
  };

  const handleDeleteLabel = async (labelId: string) => {
    if (!confirm('Are you sure you want to delete this label? This will also remove all associated pivot presets.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/labels/${labelId}`, {
        method: 'DELETE',
      });
      const data: AgentResponse = await response.json();
      
      if (data.success) {
        setLabels(labels.filter(l => l.id !== labelId));
        onLabelDeleted?.(labelId);
        addNotification({
          type: 'success',
          title: 'Label Deleted',
          message: 'Label and associated presets have been removed'
        });
      } else {
        throw new Error(data.error || 'Failed to delete label');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error Deleting Label',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const handleSaveLabel = async (labelData: Partial<DataSourceLabel>) => {
    try {
      const isEditing = editingLabel !== null;
      const url = isEditing 
        ? `http://localhost:8000/labels/${editingLabel.id}`
        : 'http://localhost:8000/labels';
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(labelData),
      });
      
      const data: AgentResponse<DataSourceLabel> = await response.json();
      
      if (data.success && data.data) {
        if (isEditing) {
          setLabels(labels.map(l => l.id === data.data.id ? data.data : l));
          onLabelUpdated?.(data.data);
        } else {
          setLabels([...labels, data.data]);
          onLabelCreated?.(data.data);
        }
        
        setIsEditorOpen(false);
        setEditingLabel(null);
        
        addNotification({
          type: 'success',
          title: isEditing ? 'Label Updated' : 'Label Created',
          message: `Label "${data.data.name}" has been ${isEditing ? 'updated' : 'created'} successfully`
        });
      } else {
        throw new Error(data.error || 'Failed to save label');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Error Saving Label',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  };

  const getUsageColor = (usageCount: number) => {
    if (usageCount === 0) return 'text-gray-400';
    if (usageCount <= 5) return 'text-yellow-600';
    if (usageCount <= 20) return 'text-blue-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading labels...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Source Labels</h2>
          <p className="text-gray-600 mt-1">
            Manage labels for recurring data structures and patterns
          </p>
        </div>
        <button
          onClick={handleCreateLabel}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Label
        </button>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search labels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredLabels.length} of {labels.length} labels
        </div>
      </div>

      {/* Labels Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLabels.map((label) => (
          <div
            key={label.id}
            className={`
              relative p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md
              ${selectedLabelId === label.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => onLabelSelect?.(label)}
          >
            {/* Color Indicator */}
            <div className="absolute top-3 right-3 flex items-center space-x-1">
              <div 
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: label.color }}
              />
              <div className="flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetails(showDetails === label.id ? null : label.id);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <EyeIcon className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditLabel(label);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-600"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLabel(label.id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                >
                  <TrashIcon className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Label Info */}
            <div className="pr-16">
              <h3 className="font-medium text-gray-900 truncate">
                {label.name}
              </h3>
              {label.description && (
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {label.description}
                </p>
              )}
              
              {/* Stats */}
              <div className="mt-3 flex items-center space-x-4 text-xs">
                <div className="flex items-center space-x-1">
                  <TagIcon className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">
                    {label.expected_columns.length} columns
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <ChartBarIcon className={`h-3 w-3 ${getUsageColor(label.usage_count)}`} />
                  <span className={getUsageColor(label.usage_count)}>
                    {label.usage_count} uses
                  </span>
                </div>
              </div>

              {/* Column Preview */}
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {label.expected_columns.slice(0, 3).map((column) => (
                    <span
                      key={column}
                      className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {column}
                    </span>
                  ))}
                  {label.expected_columns.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{label.expected_columns.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {showDetails === label.id && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-1 text-gray-500">{label.created_at}</span>
                  </div>
                  {label.last_used_at && (
                    <div>
                      <span className="font-medium text-gray-700">Last used:</span>
                      <span className="ml-1 text-gray-500">{label.last_used_at}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Expected columns:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {label.expected_columns.map((column) => (
                        <span
                          key={column}
                          className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded"
                        >
                          {column}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredLabels.length === 0 && (
        <div className="text-center py-8">
          <TagIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm ? 'No labels found' : 'No labels created yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms'
              : 'Create your first label to start organizing your data sources'
            }
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateLabel}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Label
            </button>
          )}
        </div>
      )}

      {/* Label Editor Modal */}
      {isEditorOpen && (
        <LabelEditor
          label={editingLabel}
          onSave={handleSaveLabel}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingLabel(null);
          }}
        />
      )}
    </div>
  );
};

// Label Editor Component
interface LabelEditorProps {
  label: DataSourceLabel | null;
  onSave: (labelData: Partial<DataSourceLabel>) => void;
  onCancel: () => void;
}

const LabelEditor: React.FC<LabelEditorProps> = ({ label, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: label?.name || '',
    description: label?.description || '',
    color: label?.color || '#3B82F6',
    expected_columns: label?.expected_columns || [],
    validation_rules: label?.validation_rules || {
      required_columns: label?.expected_columns || []
    }
  });
  const [newColumn, setNewColumn] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please provide a label name');
      return;
    }
    onSave(formData);
  };

  const addColumn = () => {
    if (newColumn.trim() && !formData.expected_columns.includes(newColumn.trim())) {
      setFormData({
        ...formData,
        expected_columns: [...formData.expected_columns, newColumn.trim()]
      });
      setNewColumn('');
    }
  };

  const removeColumn = (columnToRemove: string) => {
    setFormData({
      ...formData,
      expected_columns: formData.expected_columns.filter(col => col !== columnToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addColumn();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {label ? 'Edit Label' : 'Create New Label'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Monthly Financials"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Describe the type of data this label represents..."
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-10 rounded-md border border-gray-300"
              />
            </div>

            {/* Expected Columns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Columns
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newColumn}
                  onChange={(e) => setNewColumn(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Column name"
                />
                <button
                  type="button"
                  onClick={addColumn}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.expected_columns.map((column) => (
                  <span
                    key={column}
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-md"
                  >
                    {column}
                    <button
                      type="button"
                      onClick={() => removeColumn(column)}
                      className="ml-1 text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                {label ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};