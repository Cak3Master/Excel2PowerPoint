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

export interface ConversionOptions {
  font_size: number;
  font_family: string;
  table_alignment: 'center' | 'left' | 'right';
  row_spacing: number;
  column_spacing: number;
  slide_orientation: 'horizontal' | 'vertical';
  repeat_headers: boolean;
  auto_split: boolean;
}

export interface PreviewRequest {
  file_id: string;
  table_id: string;
  options: ConversionOptions;
}

export interface PreviewResponse {
  slide_content: string[][];
  slide_count: number;
  message: string;
}

export interface ConvertRequest {
  file_id: string;
  table_id: string;
  options: ConversionOptions;
}