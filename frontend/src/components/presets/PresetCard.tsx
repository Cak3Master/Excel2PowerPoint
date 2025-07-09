import React, { useState } from 'react';
import { 
  PlayIcon, 
  PencilIcon, 
  TrashIcon, 
  ClockIcon,
  TagIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { Preset } from '../../types';

interface PresetCardProps {
  preset: Preset;
  onExecute: (presetId: string) => void;
  onEdit: (preset: Preset) => void;
  onDelete: (presetId: string) => void;
  executing?: boolean;
}

export const PresetCard: React.FC<PresetCardProps> = ({
  preset,
  onExecute,
  onEdit,
  onDelete,
  executing = false
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'visualization':
        return 'bg-blue-100 text-blue-800';
      case 'pivot':
        return 'bg-green-100 text-green-800';
      case 'export':
        return 'bg-purple-100 text-purple-800';
      case 'workflow':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStepTypeIcon = (stepType: string) => {
    switch (stepType) {
      case 'visualization':
        return '📊';
      case 'pivot':
        return '📋';
      case 'export':
        return '📤';
      case 'data_transform':
        return '🔄';
      default:
        return '⚙️';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {preset.name}
              </h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(preset.type)}`}>
                {preset.type}
              </span>
            </div>
            
            {preset.description && (
              <p className="text-sm text-gray-500 mb-3">
                {preset.description}
              </p>
            )}

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center">
                <ClockIcon className="h-3 w-3 mr-1" />
                Updated {formatDate(preset.updated_at)}
              </div>
              <div className="flex items-center">
                <TagIcon className="h-3 w-3 mr-1" />
                {preset.tags.length} tags
              </div>
              <div className="flex items-center">
                <DocumentTextIcon className="h-3 w-3 mr-1" />
                {preset.workflow_steps?.length || 0} steps
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => onExecute(preset.id)}
              disabled={executing}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlayIcon className="h-4 w-4 mr-2" />
              {executing ? 'Running...' : 'Execute'}
            </button>
            
            <button
              onClick={() => onEdit(preset)}
              className="inline-flex items-center p-2 border border-gray-300 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onDelete(preset.id)}
              className="inline-flex items-center p-2 border border-gray-300 rounded-md text-red-400 hover:text-red-500 hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tags */}
        {preset.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {preset.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Expandable Details */}
      <div className="border-t border-gray-200">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-between"
        >
          <span>View Steps ({preset.workflow_steps?.length || 0})</span>
          {expanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
        </button>

        {expanded && (
          <div className="px-4 pb-4 space-y-2">
            {preset.workflow_steps?.map((step, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-2 bg-gray-50 rounded text-sm"
              >
                <span className="text-lg">{getStepTypeIcon(step.type)}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    Step {index + 1}: {step.type.replace('_', ' ')}
                  </div>
                  {step.description && (
                    <div className="text-gray-500 text-xs">
                      {step.description}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {Object.keys(step.parameters || {}).length} params
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Schedule Info */}
      {preset.schedule && preset.schedule.enabled && (
        <div className="border-t border-gray-200 px-4 py-2 bg-blue-50">
          <div className="flex items-center text-xs text-blue-700">
            <ClockIcon className="h-3 w-3 mr-1" />
            Scheduled: {preset.schedule.cron_expression}
            {preset.schedule.next_run && (
              <span className="ml-2">
                (Next: {formatDate(preset.schedule.next_run)})
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};