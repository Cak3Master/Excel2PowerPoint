import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PlusIcon, 
  TrashIcon,
  ClockIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Preset, PresetStep, PresetSchedule } from '../../types';

interface PresetEditorProps {
  preset?: Preset | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (preset: Omit<Preset, 'id' | 'created_at' | 'updated_at'>) => void;
}

export const PresetEditor: React.FC<PresetEditorProps> = ({
  preset,
  isOpen,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'workflow' as Preset['type'],
    tags: [] as string[],
    steps: [] as PresetStep[],
    schedule: null as PresetSchedule | null
  });

  const [newTag, setNewTag] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);

  useEffect(() => {
    if (preset) {
      setFormData({
        name: preset.name,
        description: preset.description || '',
        type: preset.type,
        tags: preset.tags,
        steps: preset.workflow_steps || [],
        schedule: preset.schedule
      });
      setScheduleEnabled(!!preset.schedule?.enabled);
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'workflow',
        tags: [],
        steps: [],
        schedule: null
      });
      setScheduleEnabled(false);
    }
  }, [preset]);

  const stepTypes = [
    { value: 'visualization', label: 'Visualization', icon: '📊' },
    { value: 'pivot', label: 'Pivot Table', icon: '📋' },
    { value: 'data_transform', label: 'Data Transform', icon: '🔄' },
    { value: 'export', label: 'Export', icon: '📤' }
  ];

  const presetTypes = [
    { value: 'visualization', label: 'Visualization' },
    { value: 'pivot', label: 'Pivot Table' },
    { value: 'export', label: 'Export' },
    { value: 'workflow', label: 'Workflow' }
  ];

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addStep = () => {
    const newStep: PresetStep = {
      id: Date.now().toString(),
      name: 'New Step',
      description: '',
      agent_type: 'visualization',
      action: 'create',
      parameters: {},
      depends_on: [],
      order: formData.steps.length + 1,
      timeout: 60
    };
    
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const updateStep = (index: number, updates: Partial<PresetStep>) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, ...updates } : step
      )
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scheduleData = scheduleEnabled ? {
      enabled: true,
      cron_expression: formData.schedule?.cron_expression || '0 9 * * 1',
      timezone: formData.schedule?.timezone || 'UTC',
      next_run: null
    } : null;

    onSave({
      ...formData,
      category: formData.type || 'custom',
      preset_type: formData.type || 'workflow',
      configuration: {},
      workflow_steps: formData.steps || [],
      schedule: { ...scheduleData, frequency: (scheduleData as any).frequency || 'daily' }
    } as any);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            {preset ? 'Edit Preset' : 'Create New Preset'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-md font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Enter preset name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Enter preset description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as Preset['type'] }))}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {presetTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-3">Tags</h3>
              
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                  placeholder="Add tag"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-md font-medium text-gray-900">Steps</h3>
                <button
                  type="button"
                  onClick={addStep}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Step
                </button>
              </div>

              <div className="space-y-3">
                {formData.steps.map((step, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Step {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Type
                        </label>
                        <select
                          value={step.type}
                          onChange={(e) => updateStep(index, { type: e.target.value as PresetStep['type'] })}
                          className="block w-full border border-gray-300 rounded text-sm px-2 py-1"
                        >
                          {stepTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Timeout (seconds)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="300"
                          value={step.timeout || 60}
                          onChange={(e) => updateStep(index, { timeout: parseInt(e.target.value) })}
                          className="block w-full border border-gray-300 rounded text-sm px-2 py-1"
                        />
                      </div>
                    </div>

                    <div className="mt-2">
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={step.description || ''}
                        onChange={(e) => updateStep(index, { description: e.target.value })}
                        className="block w-full border border-gray-300 rounded text-sm px-2 py-1"
                        placeholder="Step description"
                      />
                    </div>
                  </div>
                ))}

                {formData.steps.length === 0 && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No steps added yet. Click "Add Step" to get started.
                  </div>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="schedule-enabled"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.checked)}
                  className="rounded border-gray-300"
                />
                <label htmlFor="schedule-enabled" className="text-md font-medium text-gray-900">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  Enable Scheduling
                </label>
              </div>

              {scheduleEnabled && (
                <div className="space-y-3 pl-6 border-l-2 border-blue-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cron Expression
                    </label>
                    <input
                      type="text"
                      value={formData.schedule?.cron_expression || '0 9 * * 1'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, cron_expression: e.target.value, enabled: true, timezone: 'UTC', next_run: null }
                      }))}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                      placeholder="0 9 * * 1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: "0 9 * * 1" runs every Monday at 9 AM
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timezone
                    </label>
                    <select
                      value={formData.schedule?.timezone || 'UTC'}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        schedule: { ...prev.schedule, timezone: e.target.value, enabled: true, cron_expression: prev.schedule?.cron_expression || '0 9 * * 1', next_run: null }
                      }))}
                      className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center text-xs text-gray-500">
              <InformationCircleIcon className="h-4 w-4 mr-1" />
              {formData.steps.length} steps configured
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                {preset ? 'Update' : 'Create'} Preset
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};