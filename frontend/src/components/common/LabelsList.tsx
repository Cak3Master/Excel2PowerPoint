import React from 'react';
import { LabelBadge } from './LabelBadge';
import { DataSourceLabel, LabelAssignment } from '../../types';

interface LabelsListProps {
  labelAssignments: LabelAssignment[];
  labels: DataSourceLabel[];
  size?: 'small' | 'medium' | 'large';
  maxVisible?: number;
  removable?: boolean;
  onRemove?: (assignmentId: string) => void;
  className?: string;
  emptyMessage?: string;
}

export const LabelsList: React.FC<LabelsListProps> = ({
  labelAssignments,
  labels,
  size = 'medium',
  maxVisible = 3,
  removable = false,
  onRemove,
  className = '',
  emptyMessage = 'No labels assigned'
}) => {
  if (!labelAssignments || labelAssignments.length === 0) {
    return (
      <div className={`text-xs text-gray-500 italic ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  const visibleAssignments = labelAssignments.slice(0, maxVisible);
  const remainingCount = labelAssignments.length - maxVisible;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {visibleAssignments.map((assignment) => {
        const label = labels.find(l => l.id === assignment.label_id);
        if (!label) return null;

        return (
          <LabelBadge
            key={assignment.id}
            label={label}
            size={size}
            removable={removable}
            onRemove={onRemove ? () => onRemove(assignment.id) : undefined}
          />
        );
      })}
      
      {remainingCount > 0 && (
        <div
          className={`inline-flex items-center rounded-full font-medium bg-gray-100 text-gray-600 border border-gray-200 ${size === 'small' ? 'px-2 py-0.5 text-xs' : size === 'large' ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'}`}
        >
          +{remainingCount} more
        </div>
      )}
    </div>
  );
};