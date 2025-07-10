import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAppStore, useNotificationStore } from '../../stores/appStore';
import { 
  getPresets,
  createPreset,
  updatePreset,
  deletePreset,
  executePreset
} from '../../services/api';
import { Preset, AgentResponse } from '../../types';
import { PresetCard } from './PresetCard';
import { PresetEditor } from './PresetEditor';

export const PresetPage: React.FC = () => {
  const { loading, setLoading } = useAppStore();
  const { addNotification } = useNotificationStore();
  
  const [presets, setPresets] = useState<Preset[]>([]);
  const [filteredPresets, setFilteredPresets] = useState<Preset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated_at' | 'type'>('updated_at');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [executingPresets, setExecutingPresets] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadPresets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [presets, searchTerm, filterType, sortBy]);

  const loadPresets = async () => {
    setLoading(true);
    try {
      const response: AgentResponse<{ presets: Preset[] }> = await getPresets();
      
      if (response.success && response.data) {
        setPresets(response.data.presets);
      } else {
        throw new Error(response.error || 'Failed to load presets');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Loading Failed',
        message: error instanceof Error ? error.message : 'Failed to load presets'
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...presets];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(preset =>
        preset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        preset.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        preset.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(preset => preset.type === filterType);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'updated_at':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    setFilteredPresets(filtered);
  };

  const handleCreatePreset = () => {
    setEditingPreset(null);
    setIsEditorOpen(true);
  };

  const handleEditPreset = (preset: Preset) => {
    setEditingPreset(preset);
    setIsEditorOpen(true);
  };

  const handleSavePreset = async (presetData: Omit<Preset, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      if (editingPreset) {
        // Update existing preset
        const response: AgentResponse<Preset> = await updatePreset(editingPreset.id, presetData);
        
        if (response.success && response.data) {
          setPresets(prev => prev.map(p => p.id === editingPreset.id ? response.data! : p));
          addNotification({
            type: 'success',
            title: 'Preset Updated',
            message: `"${response.data.name}" has been updated successfully`
          });
        } else {
          throw new Error(response.error || 'Failed to update preset');
        }
      } else {
        // Create new preset
        const response: AgentResponse<Preset> = await createPreset(presetData);
        
        if (response.success && response.data) {
          setPresets(prev => [response.data!, ...prev]);
          addNotification({
            type: 'success',
            title: 'Preset Created',
            message: `"${response.data.name}" has been created successfully`
          });
        } else {
          throw new Error(response.error || 'Failed to create preset');
        }
      }
      
      setIsEditorOpen(false);
      setEditingPreset(null);
    } catch (error) {
      addNotification({
        type: 'error',
        title: editingPreset ? 'Update Failed' : 'Creation Failed',
        message: error instanceof Error ? error.message : 'Failed to save preset'
      });
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to delete this preset?')) return;

    try {
      const response = await deletePreset(presetId);
      
      if (response.success) {
        setPresets(prev => prev.filter(p => p.id !== presetId));
        addNotification({
          type: 'success',
          title: 'Preset Deleted',
          message: 'Preset has been deleted successfully'
        });
      } else {
        throw new Error(response.error || 'Failed to delete preset');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Deletion Failed',
        message: error instanceof Error ? error.message : 'Failed to delete preset'
      });
    }
  };

  const handleExecutePreset = async (presetId: string) => {
    setExecutingPresets(prev => new Set([...prev, presetId]));
    
    try {
      const response: AgentResponse<{
        execution_id: string;
        status: string;
        results: any[];
      }> = await executePreset(presetId);
      
      if (response.success && response.data) {
        addNotification({
          type: 'success',
          title: 'Execution Started',
          message: `Preset execution started successfully. Execution ID: ${response.data.execution_id}`
        });
      } else {
        throw new Error(response.error || 'Failed to execute preset');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Execution Failed',
        message: error instanceof Error ? error.message : 'Failed to execute preset'
      });
    } finally {
      setExecutingPresets(prev => {
        const newSet = new Set(prev);
        newSet.delete(presetId);
        return newSet;
      });
    }
  };

  const presetTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'visualization', label: 'Visualization' },
    { value: 'pivot', label: 'Pivot Table' },
    { value: 'export', label: 'Export' },
    { value: 'workflow', label: 'Workflow' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Preset Manager</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage automation presets for your workflows
          </p>
        </div>
        
        <button
          onClick={handleCreatePreset}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Preset
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search presets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-500"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-4 w-4 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {presetTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'updated_at' | 'type')}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="updated_at">Last Updated</option>
              <option value="name">Name</option>
              <option value="type">Type</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-3 text-sm text-gray-500">
          Showing {filteredPresets.length} of {presets.length} presets
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading presets...</p>
          </div>
        </div>
      )}

      {/* Presets Grid */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPresets.map((preset) => (
            <PresetCard
              key={preset.id}
              preset={preset}
              onExecute={handleExecutePreset}
              onEdit={handleEditPreset}
              onDelete={handleDeletePreset}
              executing={executingPresets.has(preset.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredPresets.length === 0 && (
        <div className="text-center py-12">
          {presets.length === 0 ? (
            <>
              <RocketLaunchIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No presets</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first automation preset.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreatePreset}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Preset
                </button>
              </div>
            </>
          ) : (
            <>
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No matching presets</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter criteria.
              </p>
            </>
          )}
        </div>
      )}

      {/* Preset Editor Modal */}
      <PresetEditor
        preset={editingPreset}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingPreset(null);
        }}
        onSave={handleSavePreset}
      />
    </div>
  );
};