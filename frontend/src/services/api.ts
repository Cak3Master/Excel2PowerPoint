import axios from 'axios';
import { 
  AnalysisResult, 
  PreviewRequest, 
  PreviewResponse, 
  ConvertRequest,
  MultiWorksheetConvertRequest,
  AgentResponse,
  DataSource,
  DataUpload,
  DataSourceLabel,
  LabelAssignment,
  LabelSuggestion,
  PivotPreset,
  ExcelFilePreview,
  DataAnalysisResult,
  ChartRecommendation,
  ChartConfiguration,
  DataRelationship,
  PivotConfiguration,
  PivotResult,
  PresetTemplate,
  PresetConfiguration,
  PresetExecution,
  ExportFormat,
  ExportTemplate,
  ExportConfiguration,
  ExportJob
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeExcel = async (file: File): Promise<AnalysisResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<AnalysisResult>('/analyze-excel', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
};

export const previewSlide = async (request: PreviewRequest): Promise<PreviewResponse> => {
  const response = await api.post<PreviewResponse>('/preview-slide', request);
  return response.data;
};

export const convertToPptx = async (request: ConvertRequest): Promise<Blob> => {
  const response = await api.post('/convert-to-pptx-simple', request, {
    responseType: 'blob',
  });
  return response.data;
};

export const convertMultiWorksheetToPptx = async (request: MultiWorksheetConvertRequest): Promise<Blob> => {
  const response = await api.post('/convert-multi-worksheet', request, {
    responseType: 'blob',
  });
  return response.data;
};

// ===================
// PIVOT AGENT API
// ===================

export const uploadDataSource = async (dataUpload: DataUpload): Promise<AgentResponse<DataSource>> => {
  const formData = new FormData();
  formData.append('file', dataUpload.file);
  formData.append('source_id', dataUpload.source_id);
  if (dataUpload.source_name) {
    formData.append('source_name', dataUpload.source_name);
  }

  const response = await api.post('/agents/pivot', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getDataSourcePreview = async (
  sourceId: string, 
  limit: number = 10, 
  offset: number = 0
): Promise<AgentResponse<any>> => {
  // This would typically be part of the upload response
  // For now, return mock data structure
  return {
    success: true,
    data: {
      columns: [],
      preview: [],
      total_rows: 0
    }
  };
};

export const detectDataRelationshipsOld = async (sourceIds: string[]): Promise<AgentResponse<{
  relationships: DataRelationship[];
  join_strategies: any[];
}>> => {
  const response = await api.post('/agents/pivot', {
    action: 'detect_relationships',
    source_ids: sourceIds
  });
  return response.data;
};

export const configurePivot = async (config: PivotConfiguration): Promise<AgentResponse<{
  pivot_id: string;
  config: PivotConfiguration;
  validation: any;
}>> => {
  const response = await api.post('/agents/pivot', {
    action: 'configure_pivot',
    ...config
  });
  return response.data;
};

export const executePivot = async (pivotConfig: PivotConfiguration): Promise<AgentResponse<{
  execution_id: string;
  pivot_result: PivotResult;
}>> => {
  const response = await api.post('/agents/pivot', {
    action: 'execute_pivot',
    pivot_config: pivotConfig
  });
  return response.data;
};

export const previewPivot = async (
  pivotConfig: PivotConfiguration,
  page: number = 1,
  pageSize: number = 100
): Promise<AgentResponse<PivotResult>> => {
  const response = await api.post('/agents/pivot', {
    action: 'preview_pivot',
    pivot_config: pivotConfig,
    page,
    page_size: pageSize
  });
  return response.data;
};

export const exportPivot = async (
  pivotId: string,
  format: 'excel' | 'csv' = 'excel'
): Promise<AgentResponse<{
  filename: string;
  download_url: string;
}>> => {
  const response = await api.post('/agents/pivot', {
    action: 'export_pivot',
    pivot_id: pivotId,
    format
  });
  return response.data;
};

// ===================
// VISUALIZATION AGENT API  
// ===================

export const analyzeDataForVisualization = async (
  dataSourceId: string,
  intent?: string
): Promise<AgentResponse<{
  analysis: DataAnalysisResult;
  recommendations: ChartRecommendation[];
}>> => {
  const response = await api.post('/agents/visualization', {
    action: 'analyze',
    data_source_id: dataSourceId,
    intent
  });
  return response.data;
};

export const configureVisualization = async (
  config: ChartConfiguration & { data_source_id: string }
): Promise<AgentResponse<{
  config_id: string;
  chart_config: any;
  preview_url: string;
}>> => {
  const response = await api.post('/agents/visualization', {
    action: 'configure',
    ...config
  });
  return response.data;
};

export const previewChart = async (
  chartId: string,
  format: 'svg' | 'png' | 'json' = 'json'
): Promise<AgentResponse<any>> => {
  const response = await api.post('/agents/visualization', {
    action: 'preview',
    chart_id: chartId,
    format
  });
  return response.data;
};

export const exportChart = async (
  chartId: string,
  format: 'png' | 'svg' | 'pdf' | 'pptx' | 'excel' = 'png'
): Promise<AgentResponse<{
  export_data: any;
  download_url: string;
  filename: string;
}>> => {
  const response = await api.post('/agents/visualization', {
    action: 'export',
    chart_id: chartId,
    format
  });
  return response.data;
};

// ===================
// PRESET AGENT API
// ===================

export const listPresetTemplates = async (
  category?: string,
  presetType?: string
): Promise<AgentResponse<{
  templates: PresetTemplate[];
  total_count: number;
}>> => {
  const response = await api.post('/agents/preset', {
    action: 'list_templates',
    category,
    preset_type: presetType
  });
  return response.data;
};

export const getPresetTemplate = async (templateId: string): Promise<AgentResponse<{
  template: PresetTemplate;
  example_data: any;
}>> => {
  const response = await api.post('/agents/preset', {
    action: 'get_template',
    template_id: templateId
  });
  return response.data;
};

export const createPresetFromTemplate = async (
  templateId: string,
  name: string,
  fieldValues: Record<string, any>,
  metadata?: Record<string, any>
): Promise<AgentResponse<{
  preset_id: string;
  preset_config: PresetConfiguration;
}>> => {
  const response = await api.post('/agents/preset', {
    action: 'create_from_template',
    template_id: templateId,
    name,
    field_values: fieldValues,
    metadata
  });
  return response.data;
};

export const savePreset = async (presetConfig: PresetConfiguration): Promise<AgentResponse<{
  preset_id: string;
  validation: any;
}>> => {
  const response = await api.post('/agents/preset', {
    action: 'save_preset',
    preset_config: presetConfig
  });
  return response.data;
};

export const listPresets = async (
  category?: string,
  presetType?: string
): Promise<AgentResponse<{
  presets: Array<{
    id: string;
    name: string;
    preset_type: string;
    category: string;
    description?: string;
    scheduled: boolean;
    next_run?: string;
  }>;
}>> => {
  const response = await api.post('/agents/preset', {
    action: 'list_presets',
    category,
    preset_type: presetType
  });
  return response.data;
};

export const executePresetConfig = async (
  presetConfig: PresetConfiguration,
  context?: Record<string, any>
): Promise<AgentResponse<{
  execution: PresetExecution;
  status_url: string;
}>> => {
  const response = await api.post('/agents/preset', {
    action: 'execute_preset',
    preset_config: presetConfig,
    context
  });
  return response.data;
};

export const getPresetExecutionStatus = async (executionId: string): Promise<AgentResponse<PresetExecution>> => {
  const response = await api.post('/agents/preset', {
    action: 'get_execution_status',
    execution_id: executionId
  });
  return response.data;
};

// ===================
// EXPORT AGENT API
// ===================

export const listExportFormats = async (): Promise<AgentResponse<{
  formats: ExportFormat[];
}>> => {
  const response = await api.post('/agents/export', {
    action: 'list_formats'
  });
  return response.data;
};

export const listExportTemplates = async (
  templateType?: string
): Promise<AgentResponse<{
  templates: ExportTemplate[];
}>> => {
  const response = await api.post('/agents/export', {
    action: 'list_templates',
    template_type: templateType
  });
  return response.data;
};

export const createExportConfiguration = async (
  config: ExportConfiguration
): Promise<AgentResponse<{
  config_id: string;
  config: ExportConfiguration;
  validation: any;
}>> => {
  const response = await api.post('/agents/export', {
    action: 'create_configuration',
    config
  });
  return response.data;
};

export const startExport = async (
  exportConfig: ExportConfiguration
): Promise<AgentResponse<{
  job_id: string;
  status: string;
  status_url: string;
}>> => {
  const response = await api.post('/agents/export', {
    action: 'start_export',
    export_config: exportConfig
  });
  return response.data;
};

export const getExportJobStatus = async (jobId: string): Promise<AgentResponse<ExportJob>> => {
  const response = await api.post('/agents/export', {
    action: 'get_job_status',
    job_id: jobId
  });
  return response.data;
};

export const listExportJobs = async (
  status?: string,
  limit?: number
): Promise<AgentResponse<{
  jobs: ExportJob[];
}>> => {
  const response = await api.post('/agents/export', {
    action: 'list_jobs',
    status,
    limit
  });
  return response.data;
};

export const downloadExportResult = async (jobId: string): Promise<AgentResponse<{
  filename: string;
  content_type: string;
  download_url: string;
}>> => {
  const response = await api.post('/agents/export', {
    action: 'download_result',
    job_id: jobId
  });
  return response.data;
};

// ===================
// MISSING EXPORTS - Added for component compatibility
// ===================

// Additional pivot functions with corrected names
export const detectDataRelationships = async (request: { source_ids: string[] }): Promise<AgentResponse<{
  relationships: DataRelationship[];
  suggestions: string[];
}>> => {
  const response = await api.post('/agents/pivot', {
    action: 'detect_relationships',
    ...request
  });
  return response.data;
};

export const configurePivotTable = async (request: {
  source_ids: string[];
  row_fields: any[];
  column_fields: any[];
  value_fields: any[];
  relationships: DataRelationship[];
}): Promise<AgentResponse<{
  config_id: string;
  preview_data: any;
}>> => {
  const response = await api.post('/agents/pivot', {
    action: 'configure_pivot',
    ...request
  });
  return response.data;
};

export const generatePivotTable = async (configId: string): Promise<AgentResponse<PivotResult>> => {
  const response = await api.post('/agents/pivot', {
    action: 'execute_pivot',
    config_id: configId
  });
  return response.data;
};

export const exportPivotTable = async (
  pivotId: string, 
  format: 'excel' | 'powerpoint'
): Promise<AgentResponse<{
  download_url: string;
  filename: string;
}>> => {
  const response = await api.post('/agents/export', {
    action: 'export_pivot',
    pivot_id: pivotId,
    format
  });
  return response.data;
};

// Preset management functions - Updated to use correct endpoint
export const getPresets = async (): Promise<AgentResponse<{ presets: any[] }>> => {
  const response = await api.get('/presets');
  return response.data;
};

export const createPreset = async (presetData: any): Promise<AgentResponse<any>> => {
  const response = await api.post('/presets', presetData);
  return response.data;
};

export const updatePreset = async (presetId: string, presetData: any): Promise<AgentResponse<any>> => {
  const response = await api.put(`/presets/${presetId}`, presetData);
  return response.data;
};

export const deletePreset = async (presetId: string): Promise<AgentResponse<void>> => {
  const response = await api.delete(`/presets/${presetId}`);
  return response.data;
};

export const executePreset = async (presetId: string): Promise<AgentResponse<{
  execution_id: string;
  status: string;
  results: any[];
}>> => {
  const response = await api.post(`/presets/${presetId}/execute`);
  return response.data;
};

// Export functions
export const createExport = async (config: ExportConfiguration): Promise<AgentResponse<{
  job_id: string;
  status: string;
  estimated_completion: string;
}>> => {
  const response = await api.post('/agents/export', {
    action: 'create_export',
    ...config
  });
  return response.data;
};

export const getExportHistory = async (): Promise<AgentResponse<{ exports: ExportJob[] }>> => {
  const response = await api.get('/exports/history');
  return response.data;
};

export const downloadExport = async (jobId: string): Promise<AgentResponse<{
  download_url: string;
  filename: string;
}>> => {
  const response = await api.post('/agents/export', {
    action: 'download_export',
    job_id: jobId
  });
  return response.data;
};

// Data source uploads
export const uploadDataSources = async (uploads: DataUpload[]): Promise<AgentResponse<DataSource[]>> => {
  const formData = new FormData();
  
  uploads.forEach((upload, index) => {
    formData.append(`files`, upload.file);
    formData.append(`source_ids`, upload.source_id);
    if (upload.source_name) {
      formData.append(`source_names`, upload.source_name);
    }
  });

  const response = await api.post('/data-sources/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Label Management API
export const getLabels = async (): Promise<AgentResponse<{ labels: DataSourceLabel[] }>> => {
  const response = await fetch(`${API_BASE_URL}/labels`);
  return response.json();
};

export const createLabel = async (labelData: Partial<DataSourceLabel>): Promise<AgentResponse<DataSourceLabel>> => {
  const response = await fetch(`${API_BASE_URL}/labels`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(labelData),
  });
  return response.json();
};

export const updateLabel = async (labelId: string, labelData: Partial<DataSourceLabel>): Promise<AgentResponse<DataSourceLabel>> => {
  const response = await fetch(`${API_BASE_URL}/labels/${labelId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(labelData),
  });
  return response.json();
};

export const deleteLabel = async (labelId: string): Promise<AgentResponse> => {
  const response = await fetch(`${API_BASE_URL}/labels/${labelId}`, {
    method: 'DELETE',
  });
  return response.json();
};

export const assignLabelToSource = async (labelId: string, data: {
  data_source_id: string;
  column_mapping: Record<string, string>;
}): Promise<AgentResponse<LabelAssignment>> => {
  const response = await fetch(`${API_BASE_URL}/labels/${labelId}/assign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

export const suggestLabels = async (data: {
  data_source_id: string;
  columns: string[];
}): Promise<AgentResponse<{ suggestions: LabelSuggestion[] }>> => {
  const response = await fetch(`${API_BASE_URL}/labels/suggest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return response.json();
};

// Pivot Presets API
export const getPivotPresets = async (): Promise<AgentResponse<{ presets: PivotPreset[] }>> => {
  const response = await fetch(`${API_BASE_URL}/pivot-presets`);
  return response.json();
};

export const getPivotPresetsByLabel = async (labelId: string): Promise<AgentResponse<{ presets: PivotPreset[] }>> => {
  const response = await fetch(`${API_BASE_URL}/pivot-presets/by-label/${labelId}`);
  return response.json();
};

export const createPivotPreset = async (presetData: Partial<PivotPreset>): Promise<AgentResponse<PivotPreset>> => {
  console.log('=== createPivotPreset API call ===');
  console.log('presetData:', presetData);
  console.log('URL:', `${API_BASE_URL}/pivot-presets`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/pivot-presets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(presetData),
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      console.error('API error response:', data);
    }
    
    return data;
  } catch (error) {
    console.error('createPivotPreset error:', error);
    throw error;
  }
};

export const updatePivotPreset = async (presetId: string, presetData: Partial<PivotPreset>): Promise<AgentResponse<PivotPreset>> => {
  const response = await fetch(`${API_BASE_URL}/pivot-presets/${presetId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(presetData),
  });
  return response.json();
};

export const deletePivotPreset = async (presetId: string): Promise<AgentResponse> => {
  const response = await fetch(`${API_BASE_URL}/pivot-presets/${presetId}`, {
    method: 'DELETE',
  });
  return response.json();
};

export const generateExcelFromPreset = async (presetId: string, dataSourceIds: string[]): Promise<AgentResponse<ExcelFilePreview>> => {
  console.log('=== generateExcelFromPreset API call ===');
  console.log('presetId:', presetId);
  console.log('dataSourceIds:', dataSourceIds);
  console.log('URL:', `${API_BASE_URL}/pivot-presets/${presetId}/generate`);
  
  try {
    const response = await fetch(`${API_BASE_URL}/pivot-presets/${presetId}/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data_source_ids: dataSourceIds
      }),
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (!response.ok) {
      console.error('API error response:', data);
    }
    
    return data;
  } catch (error) {
    console.error('generateExcelFromPreset error:', error);
    throw error;
  }
};