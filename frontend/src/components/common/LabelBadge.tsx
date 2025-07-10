import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface LabelBadgeProps {
  label: {
    id: string;
    name: string;
    color: string;
  };
  size?: 'small' | 'medium' | 'large';
  removable?: boolean;
  onRemove?: (labelId: string) => void;
  className?: string;
}

export const LabelBadge: React.FC<LabelBadgeProps> = ({
  label,
  size = 'medium',
  removable = false,
  onRemove,
  className = ''
}) => {
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-1 text-xs',
    large: 'px-3 py-1.5 text-sm'
  };

  const iconSizes = {
    small: 'h-3 w-3',
    medium: 'h-3 w-3',
    large: 'h-4 w-4'
  };

  return (
    <div
      className={`inline-flex items-center rounded-full font-medium bg-opacity-10 border border-opacity-20 group ${sizeClasses[size]} ${className}`}
      style={{ 
        backgroundColor: `${label.color}1A`, // 10% opacity
        borderColor: `${label.color}33`, // 20% opacity
        color: label.color
      }}
    >
      <div 
        className="w-2 h-2 rounded-full mr-1.5 border"
        style={{ 
          backgroundColor: label.color,
          borderColor: label.color
        }}
      />
      <span className="truncate max-w-24">{label.name}</span>
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(label.id);
          }}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-20 rounded-full p-0.5"
          style={{ 
            color: label.color,
            backgroundColor: `${label.color}1A`
          }}
          title="Remove label"
        >
          <XMarkIcon className={iconSizes[size]} />
        </button>
      )}
    </div>
  );
};