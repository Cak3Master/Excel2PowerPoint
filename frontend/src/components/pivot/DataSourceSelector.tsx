import React, { useState } from 'react';
import { 
  PlusIcon, 
  LinkIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { DataSource, DataRelationship, DataSourceLabel } from '../../types';
import { LabelsList } from '../common/LabelsList';

interface DataSourceSelectorProps {
  dataSources: DataSource[];
  selectedSources: string[];
  relationships: DataRelationship[];
  labels?: DataSourceLabel[];
  onSourceToggle: (sourceId: string) => void;
  onDetectRelationships: () => void;
  detectingRelationships?: boolean;
}

export const DataSourceSelector: React.FC<DataSourceSelectorProps> = ({
  dataSources,
  selectedSources,
  relationships,
  labels = [],
  onSourceToggle,
  onDetectRelationships,
  detectingRelationships = false
}) => {
  const [showRelationships, setShowRelationships] = useState(false);

  const getRelationshipCount = (sourceId: string) => {
    return relationships.filter(rel => 
      rel.source_id === sourceId || rel.target_id === sourceId
    ).length;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Select Data Sources</h3>
          <p className="text-sm text-gray-500 mt-1">
            Choose data sources to combine in your pivot table
          </p>
        </div>
        
        {selectedSources.length > 1 && (
          <button
            onClick={onDetectRelationships}
            disabled={detectingRelationships}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {detectingRelationships ? (
              <ArrowPathIcon className="animate-spin h-4 w-4 mr-2" />
            ) : (
              <LinkIcon className="h-4 w-4 mr-2" />
            )}
            Detect Relationships
          </button>
        )}
      </div>

      {/* Data Sources Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {dataSources.map((dataSource) => {
          const isSelected = selectedSources.includes(dataSource.id);
          const relationshipCount = getRelationshipCount(dataSource.id);
          
          return (
            <div
              key={dataSource.id}
              className={`
                relative p-4 border-2 rounded-lg cursor-pointer transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              onClick={() => onSourceToggle(dataSource.id)}
            >
              {/* Selection Indicator */}
              <div className="absolute top-3 right-3">
                {isSelected ? (
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                ) : (
                  <PlusIcon className="h-5 w-5 text-gray-400" />
                )}
              </div>

              {/* Data Source Info */}
              <div className="pr-8">
                <h4 className="font-medium text-gray-900 truncate">
                  {dataSource.name}
                </h4>
                <p className="text-sm text-gray-500 mt-1">
                  {dataSource.metadata.row_count.toLocaleString()} rows × {dataSource.metadata.column_count} columns
                </p>
                
                {/* Type Badge */}
                <div className="mt-2 flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {dataSource.type.toUpperCase()}
                  </span>
                  
                  {relationshipCount > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {relationshipCount} relationship{relationshipCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Labels */}
                {dataSource.label_assignments && dataSource.label_assignments.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Labels:</p>
                    <LabelsList
                      labelAssignments={dataSource.label_assignments}
                      labels={labels}
                      size="small"
                      maxVisible={3}
                      removable={false}
                      emptyMessage=""
                    />
                  </div>
                )}

                {/* Column Preview */}
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Columns:</p>
                  <div className="flex flex-wrap gap-1">
                    {dataSource.metadata.columns.slice(0, 3).map((column) => (
                      <span
                        key={column}
                        className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded"
                      >
                        {column}
                      </span>
                    ))}
                    {dataSource.metadata.columns.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{dataSource.metadata.columns.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selection Summary */}
      {selectedSources.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-blue-800">
                {selectedSources.length} data source{selectedSources.length !== 1 ? 's' : ''} selected
              </h4>
              <p className="text-sm text-blue-700 mt-1">
                {selectedSources.length === 1 
                  ? 'You can create a pivot table with this single data source.'
                  : `These data sources will be combined. ${relationships.length > 0 ? `Found ${relationships.length} potential relationship${relationships.length !== 1 ? 's' : ''}.` : 'Click "Detect Relationships" to find connections between them.'}`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Relationships Display */}
      {relationships.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium text-gray-900">
              Detected Relationships ({relationships.length})
            </h4>
            <button
              onClick={() => setShowRelationships(!showRelationships)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showRelationships ? 'Hide' : 'Show'} Details
            </button>
          </div>

          {showRelationships && (
            <div className="space-y-3">
              {relationships.map((relationship, index) => (
                <div
                  key={`${relationship.source_id}-${relationship.target_id}-${index}`}
                  className="p-3 border border-gray-200 rounded-lg bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {dataSources.find(ds => ds.id === relationship.source_id)?.name} 
                      </span>
                      <span className="text-xs text-gray-500">→</span>
                      <span className="text-sm font-medium text-gray-900">
                        {dataSources.find(ds => ds.id === relationship.target_id)?.name}
                      </span>
                    </div>
                    
                    <span className={`
                      inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                      ${getConfidenceColor(relationship.confidence)}
                    `}>
                      {Math.round(relationship.confidence * 100)}% match
                    </span>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span>
                        <span className="font-medium">{relationship.source_column || 'Unknown'}</span> ↔ 
                        <span className="font-medium ml-1">{relationship.target_column || 'Unknown'}</span>
                      </span>
                      <span className="text-xs text-gray-500">
                        {relationship.match_count || 0}/{relationship.total_count || 0} values match
                      </span>
                      <span className="text-xs text-gray-500">
                        Type: {relationship.relationship_type?.replace('_', ' ') || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {/* Sample Matches */}
                  {relationship.sample_matches && relationship.sample_matches.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium">Sample matches:</span>
                      {relationship.sample_matches.slice(0, 3).map((match, i) => (
                        <span key={i} className="ml-2">
                          "{match[0]}" = "{match[1]}"
                          {i < Math.min(2, relationship.sample_matches.length - 1) && ','}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {dataSources.length === 0 && (
        <div className="text-center py-8">
          <PlusIcon className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data sources available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Upload data sources first to create pivot tables.
          </p>
        </div>
      )}

      {/* Warning for single source */}
      {selectedSources.length === 1 && (
        <div className="rounded-md bg-yellow-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Single Data Source
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You can create a pivot table with a single data source, but combining multiple sources 
                  provides more powerful analysis capabilities.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};