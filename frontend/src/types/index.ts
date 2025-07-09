export interface AnalysisResult {
  message: string;
  file_id: string;
  worksheets: Worksheet[];
  tables: Table[];
}

export interface Worksheet {
  name: string;
  rows: number;
  columns: number;
  has_data: boolean;
}

export interface Table {
  id: string;
  name: string;
  worksheet: string;
  range: string;
  rows: number;
  columns: number;
  display_name: string;
}

export interface CellData {
  value: string;
  font_bold?: boolean;
  font_color?: string;
  fill_color?: number[] | string | null | undefined;
  alignment?: string;
}

export interface ConversionOptions {
  font_size: number;
  font_family: string;
  table_alignment: 'center' | 'left' | 'right';
  row_spacing: number;
  column_spacing: number;
  slide_orientation: 'horizontal' | 'vertical';
  repeat_headers: boolean;
  auto_split: boolean;
  max_rows_per_slide: number;
  // Preview editor settings
  column_widths?: number[];
  row_heights?: number[];
  show_gridlines?: boolean;
  show_horizontal_gridlines?: boolean;
  show_vertical_gridlines?: boolean;
  preview_rows?: number;
  preview_columns?: number;
}

export interface PreviewRequest {
  file_id: string;
  table_id: string;
  options: ConversionOptions;
  preview_rows?: number;
  preview_columns?: number;
}

export interface PreviewResponse {
  slide_content: CellData[][] | CellData[][][];
  slide_count: number;
  message: string;
}

export interface ConvertRequest {
  file_id: string;
  table_id: string;
  options: ConversionOptions;
}

export interface WorksheetRange {
  worksheetName: string;
  startCell: string;
  endCell: string;
  includeInDownload: boolean;
}

export interface MultiWorksheetConvertRequest {
  file_id: string;
  worksheet_ranges: WorksheetRange[];
  options: ConversionOptions;
}

// Agent System Types
export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    agent_type: string;
    execution_time: number;
    suggestions?: string[];
  };
}

// Data Source Types
export interface DataSource {
  id: string;
  name: string;
  type: 'excel' | 'csv' | 'json';
  file_path?: string;
  upload_time: string;
  metadata: {
    row_count: number;
    column_count: number;
    columns: string[];
    file_size?: number;
  };
  label_assignments?: LabelAssignment[];
  suggested_labels?: LabelSuggestion[];
}

export interface DataUpload {
  file: File;
  source_id: string;
  source_name?: string;
}

// Visualization Types
export interface ChartRecommendation {
  chart_type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'stacked_bar';
  title: string;
  description: string;
  confidence: number;
  data_mapping: {
    x?: string;
    y?: string;
    series?: string;
    value?: string;
  };
}

export interface DataAnalysisResult {
  row_count: number;
  column_count: number;
  columns: Array<{
    name: string;
    type: string;
    non_null_count: number;
    unique_count: number;
  }>;
  data_patterns: {
    has_time_series: boolean;
    has_numeric_data: boolean;
    has_categorical_data: boolean;
    missing_data_percentage: number;
  };
  preview: Record<string, any>[];
}

export interface ChartConfiguration {
  chart_type: string;
  title?: string;
  data_mapping: Record<string, string>;
  styling?: {
    theme?: string;
    colors?: string[];
    font_size?: number;
  };
  interactivity?: {
    zoom?: boolean;
    hover?: boolean;
    click?: boolean;
  };
  layout?: {
    width?: number;
    height?: number;
    margin?: Record<string, number>;
  };
}

// Pivot Types
export interface PivotField {
  source_id: string;
  column_name: string;
  role: 'row' | 'column' | 'value';
  aggregation?: 'sum' | 'count' | 'mean' | 'median' | 'min' | 'max';
  display_name?: string;
}

export interface JoinConfiguration {
  source_id: string;
  target_id: string;
  join_type: 'inner' | 'left' | 'right' | 'outer';
  source_column: string;
  target_column: string;
}

export interface DataRelationship {
  source_id: string;
  target_id: string;
  source_column: string;
  target_column: string;
  relationship_type: string;
  confidence: number;
  match_count: number;
  total_count: number;
  sample_matches: Array<[any, any]>;
}

export interface PivotConfiguration {
  id?: string;
  name: string;
  source_ids: string[];
  row_fields: PivotField[];
  column_fields: PivotField[];
  value_fields: PivotField[];
  join_configs: JoinConfiguration[];
  filters?: Array<{
    field: string;
    operator: string;
    value: any;
  }>;
}

export interface PivotResult {
  columns: string[];
  rows: any[][];
  data: any[][];
  total_rows: number;
  page: number;
  page_size: number;
  total_pages: number;
  metadata: {
    row_count: number;
    column_count: number;
    row_fields: string[];
    column_fields: string[];
    value_fields: string[];
    aggregation_time?: number;
  };
  summary?: Record<string, any>;
}

// Preset Types
export interface PresetTemplate {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'finance' | 'marketing' | 'operations' | 'custom';
  preset_type: 'visualization' | 'pivot' | 'export' | 'workflow';
  required_fields: string[];
  optional_fields: string[];
  example_data?: Record<string, any>;
}

export interface PresetConfiguration {
  id?: string;
  name: string;
  preset_type: string;
  metadata: {
    category: string;
    description?: string;
    tags: string[];
  };
  schedule: {
    enabled: boolean;
    frequency: string;
    next_run?: string;
  };
  workflow_steps?: Array<{
    id: string;
    name: string;
    agent_config: {
      agent_type: string;
      action: string;
      parameters: Record<string, any>;
    };
    depends_on: string[];
  }>;
  agent_config?: {
    agent_type: string;
    action: string;
    parameters: Record<string, any>;
  };
}

export interface PresetExecution {
  id: string;
  preset_id: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  started_at: string;
  completed_at?: string;
  step_results: Array<{
    step_id: string;
    status: string;
    result?: any;
    error?: string;
  }>;
  output_data?: any;
  error_message?: string;
}

// Export Types
export interface ExportFormat {
  format: 'pptx' | 'excel' | 'pdf' | 'csv' | 'json';
  name: string;
  description: string;
  supports_charts: boolean;
  supports_tables: boolean;
  supports_templates: boolean;
}

export interface ExportTemplate {
  id: string;
  name: string;
  type: 'corporate' | 'minimal' | 'modern' | 'custom';
  colors: Record<string, string>;
  fonts: Record<string, string>;
  layouts: string[];
  description?: string;
  preview_url?: string;
  format_support?: string[];
  features: {
    branding: boolean;
    custom_master: boolean;
    layout_count: number;
  };
}

export interface ExportConfiguration {
  id?: string;
  name: string;
  format: string;
  data_sources: Array<{
    source_id: string;
    source_type: string;
  }>;
  template?: string;
  include_charts?: boolean;
  include_summary?: boolean;
  output_filename?: string;
  content?: {
    include_data: boolean;
    include_charts: boolean;
    include_summary: boolean;
    include_pivot_tables?: boolean;
    include_raw_data?: boolean;
    selected_items?: string[];
  };
  formatting?: {
    template: string;
    theme: string;
    font_size: number;
    font_family?: string;
    include_headers?: boolean;
    include_footers?: boolean;
  };
  output?: {
    filename: string;
    quality: string;
    compression: boolean;
    password_protect?: boolean;
  };
}

export interface ExportJob {
  id: string;
  name?: string;
  format?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  completed_at?: string;
  progress?: number;
  output_size?: number;
  download_url?: string;
  configuration: ExportConfiguration;
  estimated_completion?: string;
}

// UI State Types
export interface AppState {
  currentStep: 'upload' | 'analyze' | 'configure' | 'export';
  dataSources: DataSource[];
  activeDataSource?: string;
  analysisResults?: DataAnalysisResult;
  chartRecommendations: ChartRecommendation[];
  pivotConfig?: PivotConfiguration;
  exportConfig?: ExportConfiguration;
  loading: boolean;
  error?: string;
}

export interface NotificationState {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    timestamp: string;
    read: boolean;
  }>;
}

// Label Management Types
export interface DataSourceLabel {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  expected_columns: string[];
  column_mapping: Record<string, string>; // maps expected column to actual column
  validation_rules?: {
    required_columns: string[];
    min_rows?: number;
    max_rows?: number;
    data_types?: Record<string, string>;
  };
  usage_count: number;
  last_used_at?: string;
}

export interface LabelAssignment {
  id: string;
  data_source_id: string;
  label_id: string;
  assigned_at: string;
  column_mapping: Record<string, string>;
  validation_status: 'valid' | 'warning' | 'invalid';
  validation_messages: string[];
}

export interface LabelSuggestion {
  label_id: string;
  label_name: string;
  confidence: number;
  matching_columns: string[];
  missing_columns: string[];
  extra_columns: string[];
  similarity_score: number;
}

export interface PivotTableDefinition {
  id: string;
  name: string;
  description?: string;
  configuration: {
    row_fields: PivotField[];
    column_fields: PivotField[];
    value_fields: PivotField[];
  };
  sheet_name: string;
  position: {
    row: number;
    column: number;
  };
  created_at: string;
}

export interface ExcelFilePreview {
  id: string;
  name: string;
  sheets: ExcelSheetPreview[];
  pivot_tables: PivotTableDefinition[];
  raw_data_sheets: string[];
  metadata: {
    total_rows: number;
    total_columns: number;
    file_size: number;
    created_at: string;
    file_path?: string;
    download_url?: string;
  };
}

export interface ExcelSheetPreview {
  name: string;
  type: 'data' | 'pivot' | 'summary';
  content_type: 'raw_data' | 'pivot_table' | 'summary_stats';
  row_count: number;
  column_count: number;
  columns: string[];
  preview_data: any[][];
  source_label?: string;
  source_data_source_id?: string;
}

export interface PivotPreset {
  id: string;
  name: string;
  description?: string;
  label_id: string;
  pivot_tables: PivotTableDefinition[];
  excel_structure: {
    sheets: ExcelSheetPreview[];
    layout: 'separate_sheets' | 'single_sheet';
    include_raw_data: boolean;
    include_summary: boolean;
  };
  created_at: string;
  updated_at: string;
  created_by?: string;
  usage_count: number;
  last_used_at?: string;
  is_public: boolean;
  tags: string[];
}

// Additional missing types
export interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  preset_type: string;
  type?: string;
  configuration: any;
  schedule: PresetSchedule;
  tags: string[];
  created_at: string;
  updated_at: string;
  workflow_steps: PresetStep[];
}

export interface PresetStep {
  id: string;
  name: string;
  description: string;
  agent_type: string;
  action: string;
  parameters: Record<string, any>;
  depends_on: string[];
  order: number;
  type?: string;
  timeout?: number;
}

export interface PresetSchedule {
  enabled: boolean;
  frequency: string;
  next_run?: string;
  last_run?: string;
  cron_expression?: string;
  timezone?: string;
}

// Store interfaces
export interface PivotStore {
  selectedSources: string[];
  pivotConfiguration: PivotConfiguration | null;
  pivotResult: PivotResult | null;
  setSelectedSources: (sources: string[]) => void;
  setPivotConfiguration: (config: PivotConfiguration) => void;
  setPivotResult: (result: PivotResult) => void;
}

export interface ExportStore {
  activeExports: Set<string>;
  exportHistory: ExportJob[];
  setActiveExports: (exports: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setExportHistory: (history: ExportJob[]) => void;
}

// Component prop types
export interface MultiSourceUploadProps {
  dataSources: DataSource[];
  onDataSourceAdded: (source: DataSource) => void;
  onDataSourceRemoved: (id: string) => void;
}