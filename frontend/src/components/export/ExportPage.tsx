import React, { useState, useEffect } from 'react';
import { 
  ArrowDownTrayIcon, 
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PresentationChartBarIcon
} from '@heroicons/react/24/outline';
import { useAppStore, useNotificationStore, useExportStore } from '../../stores/appStore';
import { 
  createExport,
  getExportHistory,
  downloadExport
} from '../../services/api';
import { ExportConfiguration, ExportJob, AgentResponse } from '../../types';
import { ExportWizard } from './ExportWizard';

export const ExportPage: React.FC = () => {
  const { dataSources, loading, setLoading } = useAppStore();
  const { addNotification } = useNotificationStore();
  const { activeExports, exportHistory, setActiveExports, setExportHistory } = useExportStore();
  
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  // Mock available data - in real implementation, this would come from API
  const availableData = {
    charts: [
      { id: 'chart-1', name: 'Sales by Region', type: 'bar' },
      { id: 'chart-2', name: 'Revenue Trend', type: 'line' },
      { id: 'chart-3', name: 'Market Share', type: 'pie' }
    ],
    pivotTables: [
      { id: 'pivot-1', name: 'Sales Summary', rows: 25, columns: 8 },
      { id: 'pivot-2', name: 'Product Analysis', rows: 42, columns: 12 }
    ],
    dataSources: dataSources
  };

  useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = async () => {
    try {
      const response: AgentResponse<{ exports: ExportJob[] }> = await getExportHistory();
      
      if (response.success && response.data) {
        setExportHistory(response.data.exports);
        setExportJobs(response.data.exports);
      }
    } catch (error) {
      console.error('Failed to load export history:', error);
    }
  };

  const handleExport = async (config: ExportConfiguration) => {
    setIsWizardOpen(false);
    setLoading(true);

    try {
      const response: AgentResponse<{
        job_id: string;
        status: string;
        estimated_completion: string;
      }> = await createExport(config);

      if (response.success && response.data) {
        const newJob: ExportJob = {
          id: response.data.job_id,
          configuration: config,
          status: 'processing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          progress: 0,
          estimated_completion: response.data.estimated_completion
        };

        setExportJobs(prev => [newJob, ...prev]);
        setActiveExports(prev => new Set([...prev, newJob.id]));

        addNotification({
          type: 'success',
          title: 'Export Started',
          message: `Export job ${response.data.job_id} has been started`
        });

        // Simulate progress updates (in real implementation, use WebSocket or polling)
        simulateProgress(newJob.id);
      } else {
        throw new Error(response.error || 'Failed to start export');
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error instanceof Error ? error.message : 'Failed to start export'
      });
    } finally {
      setLoading(false);
    }
  };

  const simulateProgress = (jobId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        setExportJobs(prev => prev.map(job => 
          job.id === jobId 
            ? { 
                ...job, 
                status: 'completed' as const, 
                progress: 100,
                completed_at: new Date().toISOString(),
                download_url: `/api/exports/${jobId}/download`,
                updated_at: new Date().toISOString()
              }
            : job
        ));
        
        setActiveExports(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });

        addNotification({
          type: 'success',
          title: 'Export Complete',
          message: `Export ${jobId} is ready for download`
        });
      } else {
        setExportJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, progress, updated_at: new Date().toISOString() } : job
        ));
      }
    }, 1000);
  };

  const handleDownload = async (job: ExportJob) => {
    if (!job.download_url) return;

    try {
      const response = await downloadExport(job.id);
      
      if (response.success && response.data) {
        // Trigger download
        const link = document.createElement('a');
        link.href = response.data.download_url;
        link.download = response.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addNotification({
          type: 'success',
          title: 'Download Started',
          message: `Downloading ${response.data.filename}`
        });
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Download Failed',
        message: error instanceof Error ? error.message : 'Failed to download export'
      });
    }
  };

  const getStatusIcon = (status: string, progress?: number) => {
    switch (status) {
      case 'processing':
        return (
          <div className="relative">
            <ClockIcon className="h-5 w-5 text-blue-500" />
            {progress !== undefined && (
              <div className="absolute -bottom-1 -right-1 text-xs text-blue-600 font-bold">
                {Math.round(progress)}%
              </div>
            )}
          </div>
        );
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Export Center</h2>
          <p className="text-sm text-gray-500 mt-1">
            Export your data and visualizations to Excel or PowerPoint
          </p>
        </div>
        
        <button
          onClick={() => setIsWizardOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          New Export
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <ArrowDownTrayIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Exports</p>
              <p className="text-2xl font-semibold text-gray-900">{exportJobs.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">In Progress</p>
              <p className="text-2xl font-semibold text-gray-900">
                {exportJobs.filter(job => job.status === 'processing').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-2xl font-semibold text-gray-900">
                {exportJobs.filter(job => job.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Available Data</p>
              <p className="text-2xl font-semibold text-gray-900">
                {availableData.charts.length + availableData.pivotTables.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Export History</h3>
        </div>
        
        <div className="overflow-hidden">
          {exportJobs.length === 0 ? (
            <div className="text-center py-12">
              <ArrowDownTrayIcon className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No exports yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create your first export to get started.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Export
                </button>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {exportJobs.map((job) => (
                <div key={job.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status, job.progress)}
                      
                      <div className="flex items-center space-x-2">
                        {job.configuration.format === 'excel' ? (
                          <DocumentTextIcon className="h-5 w-5 text-green-600" />
                        ) : (
                          <PresentationChartBarIcon className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                      
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {job.configuration.output?.filename || 'Export'}.{job.configuration.format === 'excel' ? 'xlsx' : 'pptx'}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Created {formatDate(job.created_at)}</span>
                          <span>•</span>
                          <span>{job.configuration.template || 'Default'} template</span>
                          <span>•</span>
                          <span>{job.configuration.content?.selected_items?.length || 0} items</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      
                      {job.status === 'completed' && job.download_url && (
                        <button
                          onClick={() => handleDownload(job)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {job.status === 'processing' && job.progress !== undefined && (
                    <div className="mt-3">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Processing...</span>
                        <span>{Math.round(job.progress || 0)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Export Wizard Modal */}
      <ExportWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onExport={handleExport}
        availableData={availableData}
      />
    </div>
  );
};