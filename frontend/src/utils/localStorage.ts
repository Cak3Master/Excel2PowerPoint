import { ConversionOptions } from '../types';

// Local storage keys
const STORAGE_KEYS = {
  FORMATTING_OPTIONS: 'excel2ppt_formatting_options',
  SHEET_STATES: 'excel2ppt_sheet_states',
} as const;

// Sheet-specific state interface
export interface SheetState {
  columnWidths: number[];
  rowHeights: number[];
  showGridlines: boolean;
  showHorizontalGridlines: boolean;
  showVerticalGridlines: boolean;
  previewRows: number;
  previewColumns: number;
  headerRows: number; // Number of rows to treat as headers
}

// Default sheet state
export const DEFAULT_SHEET_STATE: SheetState = {
  columnWidths: [],
  rowHeights: [],
  showGridlines: true,
  showHorizontalGridlines: true,
  showVerticalGridlines: true,
  previewRows: 50,
  previewColumns: 20,
  headerRows: 1, // Default to 1 header row
};

// Default formatting options
export const DEFAULT_FORMATTING_OPTIONS: ConversionOptions = {
  font_size: 12,
  font_family: 'Arial',
  table_alignment: 'center',
  row_spacing: 1.0,
  column_spacing: 1.0,
  slide_orientation: 'horizontal',
  repeat_headers: true,
  auto_split: true,
  max_rows_per_slide: 20,
};

// Utility functions for safe JSON operations
const safeJSONParse = <T>(value: string | null, defaultValue: T): T => {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch {
    return defaultValue;
  }
};

const safeJSONStringify = (value: any): string => {
  try {
    return JSON.stringify(value);
  } catch {
    return '{}';
  }
};

// Generate unique key for sheet/table combination
// All tables and full worksheet from the same sheet share the same key
export const generateSheetKey = (fileId: string, tableId: string): string => {
  // Extract sheet name from tableId
  let sheetName: string;
  
  if (tableId.startsWith('worksheet_')) {
    // Full worksheet: "worksheet_SheetName" -> "SheetName"
    sheetName = tableId.replace('worksheet_', '');
  } else {
    // Table: "SheetName_table_0" -> "SheetName"
    const parts = tableId.split('_table_');
    sheetName = parts[0];
  }
  
  // Use only the sheet name for the key, so all tables from the same sheet share settings
  return `${fileId}_${sheetName}`;
};

// Formatting options storage
export const saveFormattingOptions = (options: ConversionOptions): void => {
  localStorage.setItem(STORAGE_KEYS.FORMATTING_OPTIONS, safeJSONStringify(options));
};

export const loadFormattingOptions = (): ConversionOptions => {
  const stored = localStorage.getItem(STORAGE_KEYS.FORMATTING_OPTIONS);
  return safeJSONParse(stored, DEFAULT_FORMATTING_OPTIONS);
};

// Sheet state storage
export const saveSheetState = (sheetKey: string, state: SheetState): void => {
  const allStates = loadAllSheetStates();
  allStates[sheetKey] = state;
  localStorage.setItem(STORAGE_KEYS.SHEET_STATES, safeJSONStringify(allStates));
};

export const loadSheetState = (sheetKey: string): SheetState => {
  const allStates = loadAllSheetStates();
  return allStates[sheetKey] || { ...DEFAULT_SHEET_STATE };
};

export const loadAllSheetStates = (): Record<string, SheetState> => {
  const stored = localStorage.getItem(STORAGE_KEYS.SHEET_STATES);
  return safeJSONParse(stored, {});
};

// Cleanup old sheet states (optional - to prevent localStorage bloat)
export const cleanupOldSheetStates = (activeSheetKeys: string[]): void => {
  const allStates = loadAllSheetStates();
  const cleanedStates: Record<string, SheetState> = {};
  
  activeSheetKeys.forEach(key => {
    if (allStates[key]) {
      cleanedStates[key] = allStates[key];
    }
  });
  
  localStorage.setItem(STORAGE_KEYS.SHEET_STATES, safeJSONStringify(cleanedStates));
};

// Clear all stored data (for reset functionality)
export const clearAllStoredData = (): void => {
  localStorage.removeItem(STORAGE_KEYS.FORMATTING_OPTIONS);
  localStorage.removeItem(STORAGE_KEYS.SHEET_STATES);
};