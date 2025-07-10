import React from 'react';
import { 
  CloudArrowUpIcon, 
  ChartBarIcon, 
  TableCellsIcon, 
  CogIcon,
  DocumentArrowDownIcon,
  PlayIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { useAppStore, useNotificationStore } from '../../stores/appStore';

interface NavigationProps {
  onStepChange: (step: 'upload' | 'analyze' | 'configure' | 'export') => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onStepChange }) => {
  const { currentStep, dataSources } = useAppStore();
  const { notifications } = useNotificationStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const steps = [
    {
      id: 'upload' as const,
      name: 'Data Upload',
      description: 'Upload and manage data sources',
      icon: CloudArrowUpIcon,
      completed: dataSources.length > 0,
      disabled: false
    },
    {
      id: 'analyze' as const,
      name: 'Analysis',
      description: 'Analyze data and get recommendations',
      icon: ChartBarIcon,
      completed: false, // Would be set based on analysis state
      disabled: dataSources.length === 0
    },
    {
      id: 'configure' as const,
      name: 'Configure',
      description: 'Set up pivots and visualizations',
      icon: TableCellsIcon,
      completed: false, // Would be set based on configuration state
      disabled: dataSources.length === 0
    },
    {
      id: 'export' as const,
      name: 'Export',
      description: 'Generate and download results',
      icon: DocumentArrowDownIcon,
      completed: false, // Would be set based on export state
      disabled: dataSources.length === 0
    }
  ];

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <TableCellsIcon className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-gray-900">
                Excel Analytics Platform
              </h1>
              <p className="text-sm text-gray-500">
                Visual analytics and automation
              </p>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isPrevious = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <button
                  key={step.id}
                  onClick={() => !step.disabled && onStepChange(step.id)}
                  disabled={step.disabled}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : step.disabled
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className={`
                    flex items-center justify-center w-8 h-8 rounded-full
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : step.completed || isPrevious
                        ? 'bg-green-600 text-white'
                        : step.disabled
                          ? 'bg-gray-200 text-gray-400'
                          : 'bg-gray-300 text-gray-600'
                    }
                  `}>
                    {step.completed || isPrevious ? (
                      <div className="w-3 h-3 bg-white rounded-full" />
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-medium">{step.name}</div>
                    <div className="text-xs opacity-75">{step.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <PlayIcon className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <CogIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-gray-200">
        <div 
          className="h-1 bg-blue-600 transition-all duration-300"
          style={{ 
            width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` 
          }}
        />
      </div>
    </div>
  );
};