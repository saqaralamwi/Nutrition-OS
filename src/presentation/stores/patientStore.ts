import { create, StateCreator } from 'zustand';
import { PatientMetrics } from '../../domain/entities/PatientMetrics';
import { NutritionPlan } from '../../domain/entities/NutritionPlan';


export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}

export interface PatientState {
  patients: any[];
  totalCount: number;
  activeCount: number;
  isLoading: boolean;
  error: string | null;
  sortOrder: string;
  searchQuery: string;

  currentMetrics: PatientMetrics | null;
  currentPlan: NutritionPlan | null;
  isCalculating: boolean;
  isGeneratingPlan: boolean;

  toast: ToastMessage | null;

  loadPatients: () => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  setSortOrder: (order: string) => Promise<void>;
  deletePatient: (id: string) => Promise<boolean>;
  addPatient: (input: any) => Promise<{ success: boolean; errors?: any[]; patient?: any }>;

  loadMetricsForPatient: (patientId: string) => Promise<void>;
  loadPlanForPatient: (patientId: string) => Promise<void>;
  calculateMetrics: (input: any) => Promise<void>;
  generatePlan: (input: any) => Promise<void>;

  showToast: (text: string, type: ToastMessage['type']) => void;
  hideToast: () => void;
}

const DB_NOT_READY = 'قاعدة البيانات قيد إعادة البناء (Phase 4). الرجاء المحاولة لاحقاً.';

const storeCreator: StateCreator<PatientState> = (set, get) => ({
  patients: [],
  totalCount: 0,
  activeCount: 0,
  isLoading: false,
  error: null,
  sortOrder: 'newest',
  searchQuery: '',

  currentMetrics: null,
  currentPlan: null,
  isCalculating: false,
  isGeneratingPlan: false,

  toast: null,

  loadPatients: async () => {
    set({ isLoading: true, error: null });
    try {
      const { GetPatientsUseCase } = await import('../../domain/use-cases/GetPatientsUseCase');
      const useCase = new GetPatientsUseCase();
      const result = await useCase.execute();
      set({ patients: result, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  searchPatients: async (query: string) => {
    set({ isLoading: true, searchQuery: query });
    try {
      const { SearchPatientsUseCase } = await import('../../domain/use-cases/SearchPatientsUseCase');
      const useCase = new SearchPatientsUseCase();
      const result = await useCase.execute(query);
      set({ patients: result, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  setSortOrder: async (order: string) => {
    set({ sortOrder: order });
  },

  deletePatient: async (id: string): Promise<boolean> => {
    try {
      const { DeletePatientUseCase } = await import('../../domain/use-cases/DeletePatientUseCase');
      const useCase = new DeletePatientUseCase();
      await useCase.execute(id);
      const current = get().patients.filter((p: any) => p.id !== id);
      set({ patients: current });
      return true;
    } catch {
      get().showToast(DB_NOT_READY, 'error');
      return false;
    }
  },

  addPatient: async (input: any) => {
    try {
      const { CreatePatientUseCase } = await import('../../domain/use-cases/CreatePatientUseCase');
      const useCase = new CreatePatientUseCase();
      const patient = await useCase.execute(input);
      return { success: true, patient };
    } catch {
      get().showToast(DB_NOT_READY, 'error');
      return { success: false };
    }
  },

  loadMetricsForPatient: async (_patientId: string) => {
    set({ isCalculating: false, currentMetrics: null });
  },

  loadPlanForPatient: async (_patientId: string) => {
    set({ currentPlan: null });
  },

  calculateMetrics: async (_input: any) => {
    set({ isCalculating: false });
  },

  generatePlan: async (_input: any) => {
    set({ isGeneratingPlan: false });
  },



  showToast: (text: string, type: ToastMessage['type']) => {
    const id = Date.now().toString();
    set({ toast: { id, text, type } });
    setTimeout(() => {
      const current = get().toast;
      if (current?.id === id) {
        set({ toast: null });
      }
    }, 3000);
  },

  hideToast: () => set({ toast: null }),
});

export const usePatientStore = create<PatientState>(storeCreator);
