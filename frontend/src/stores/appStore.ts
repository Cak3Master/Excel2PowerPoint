import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { 
  AppState, 
  DataSource, 
  DataAnalysisResult, 
  ChartRecommendation,
  PivotConfiguration,
  ExportConfiguration,
  ExportJob
} from '../types';

interface AppStore extends AppState {
  // Actions
  setCurrentStep: (step: AppState['currentStep']) => void;
  addDataSource: (dataSource: DataSource) => void;
  updateDataSource: (dataSource: DataSource) => void;
  removeDataSource: (sourceId: string) => void;
  setActiveDataSource: (sourceId: string | undefined) => void;
  setAnalysisResults: (results: DataAnalysisResult) => void;
  setChartRecommendations: (recommendations: ChartRecommendation[]) => void;
  setPivotConfig: (config: PivotConfiguration | undefined) => void;
  setExportConfig: (config: ExportConfiguration | undefined) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | undefined) => void;
  resetState: () => void;
}

const initialState: AppState = {
  currentStep: 'upload',
  dataSources: [],
  activeDataSource: undefined,
  analysisResults: undefined,
  chartRecommendations: [],
  pivotConfig: undefined,
  exportConfig: undefined,
  loading: false,
  error: undefined
};

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,

    setCurrentStep: (step) => set({ currentStep: step }),

    addDataSource: (dataSource) => set((state) => {
      // Check if data source already exists
      const existingIndex = state.dataSources.findIndex(ds => ds.id === dataSource.id);
      if (existingIndex !== -1) {
        // Avoid updating if it's the same object reference or same content
        const existing = state.dataSources[existingIndex];
        if (existing === dataSource || JSON.stringify(existing) === JSON.stringify(dataSource)) {
          return state; // No change needed
        }
        // Update existing data source
        const updatedDataSources = [...state.dataSources];
        updatedDataSources[existingIndex] = dataSource;
        // Ensure no duplicates in final array
        const deduplicatedSources = Array.from(new Map(updatedDataSources.map(ds => [ds.id, ds])).values());
        return { dataSources: deduplicatedSources };
      } else {
        // Add new data source and deduplicate
        const newDataSources = [...state.dataSources, dataSource];
        const deduplicatedSources = Array.from(new Map(newDataSources.map(ds => [ds.id, ds])).values());
        return { dataSources: deduplicatedSources };
      }
    }),

    updateDataSource: (dataSource) => set((state) => {
      const existingIndex = state.dataSources.findIndex(ds => ds.id === dataSource.id);
      if (existingIndex !== -1) {
        const updatedDataSources = [...state.dataSources];
        updatedDataSources[existingIndex] = dataSource;
        // Ensure no duplicates in final array
        const deduplicatedSources = Array.from(new Map(updatedDataSources.map(ds => [ds.id, ds])).values());
        return { dataSources: deduplicatedSources };
      }
      // If data source doesn't exist, add it and deduplicate
      const newDataSources = [...state.dataSources, dataSource];
      const deduplicatedSources = Array.from(new Map(newDataSources.map(ds => [ds.id, ds])).values());
      return { dataSources: deduplicatedSources };
    }),

    removeDataSource: (sourceId) => set((state) => ({
      dataSources: state.dataSources.filter(ds => ds.id !== sourceId),
      activeDataSource: state.activeDataSource === sourceId ? undefined : state.activeDataSource
    })),

    setActiveDataSource: (sourceId) => set({ activeDataSource: sourceId }),

    setAnalysisResults: (results) => set({ analysisResults: results }),

    setChartRecommendations: (recommendations) => set({ chartRecommendations: recommendations }),

    setPivotConfig: (config) => set({ pivotConfig: config }),

    setExportConfig: (config) => set({ exportConfig: config }),

    setLoading: (loading) => set({ loading }),

    setError: (error) => set({ error }),

    resetState: () => set(initialState)
  }))
);

// Notification Store
interface NotificationStore {
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
    timestamp: string;
    read: boolean;
  }>;
  addNotification: (notification: Omit<NotificationStore['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],

  addNotification: (notification) => set((state) => ({
    notifications: [
      {
        ...notification,
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        read: false
      },
      ...state.notifications
    ].slice(0, 10) // Keep only last 10 notifications
  })),

  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    )
  })),

  clearAll: () => set({ notifications: [] })
}));

// Pivot Store for complex pivot state management
interface PivotStore {
  relationships: any[];
  joinStrategies: any[];
  pivotHistory: PivotConfiguration[];
  currentPivotResult: any;
  selectedSources: string[];
  pivotConfiguration: PivotConfiguration | null;
  pivotResult: any | null;
  pivotTables: any[]; // Store for pivot table definitions
  currentPreset: any | null; // Store for current preset
  setRelationships: (relationships: any[]) => void;
  setJoinStrategies: (strategies: any[]) => void;
  addToPivotHistory: (config: PivotConfiguration) => void;
  setCurrentPivotResult: (result: any) => void;
  setSelectedSources: (sources: string[]) => void;
  setPivotConfiguration: (config: PivotConfiguration | null) => void;
  setPivotResult: (result: any | null) => void;
  setPivotTables: (tables: any[]) => void;
  setCurrentPreset: (preset: any | null) => void;
  clearPivotData: () => void;
}

export const usePivotStore = create<PivotStore>()(
  persist(
    (set) => ({
      relationships: [],
      joinStrategies: [],
      pivotHistory: [],
      currentPivotResult: null,
      selectedSources: [],
      pivotConfiguration: null,
      pivotResult: null,
      pivotTables: [],
      currentPreset: null,

      setRelationships: (relationships) => set({ relationships }),
      setJoinStrategies: (strategies) => set({ joinStrategies: strategies }),
      
      addToPivotHistory: (config) => set((state) => ({
        pivotHistory: [config, ...state.pivotHistory].slice(0, 5) // Keep last 5
      })),

      setCurrentPivotResult: (result) => set({ currentPivotResult: result }),
      setSelectedSources: (sources) => set({ selectedSources: sources }),
      setPivotConfiguration: (config) => set({ pivotConfiguration: config }),
      setPivotResult: (result) => set({ pivotResult: result }),
      setPivotTables: (tables) => set({ pivotTables: tables }),
      setCurrentPreset: (preset) => set({ currentPreset: preset }),

      clearPivotData: () => set({ 
        relationships: [], 
        joinStrategies: [], 
        currentPivotResult: null,
        selectedSources: [],
        pivotConfiguration: null,
        pivotResult: null,
        pivotTables: [],
        currentPreset: null
      })
    }),
    {
      name: 'pivot-store', // unique name for localStorage key
      partialize: (state) => ({
        // Persist only the important data, exclude temporary states
        selectedSources: state.selectedSources,
        relationships: state.relationships,
        pivotTables: state.pivotTables,
        currentPreset: state.currentPreset,
        pivotHistory: state.pivotHistory,
        pivotConfiguration: state.pivotConfiguration
      })
    }
  )
);

// Export Store for export job management
interface ExportStore {
  activeJobs: any[];
  completedJobs: any[];
  exportHistory: ExportJob[];
  activeExports: Set<string>;
  setActiveExports: (exports: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  setExportHistory: (history: ExportJob[]) => void;
  addActiveJob: (job: any) => void;
  moveJobToCompleted: (jobId: string, result: any) => void;
  addToExportHistory: (config: ExportJob) => void;
  clearJobs: () => void;
}

export const useExportStore = create<ExportStore>((set) => ({
  activeJobs: [],
  completedJobs: [],
  exportHistory: [],
  activeExports: new Set<string>(),

  setActiveExports: (exports) => set((state) => ({ 
    activeExports: typeof exports === 'function' ? exports(state.activeExports) : exports 
  })),
  setExportHistory: (history) => set({ exportHistory: history }),

  addActiveJob: (job) => set((state) => ({
    activeJobs: [...state.activeJobs, job]
  })),

  moveJobToCompleted: (jobId, result) => set((state) => ({
    activeJobs: state.activeJobs.filter(job => job.id !== jobId),
    completedJobs: [result, ...state.completedJobs].slice(0, 20) // Keep last 20
  })),

  addToExportHistory: (job) => set((state) => ({
    exportHistory: [job, ...state.exportHistory].slice(0, 10) // Keep last 10
  })),

  clearJobs: () => set({ 
    activeJobs: [], 
    completedJobs: [] 
  })
}));