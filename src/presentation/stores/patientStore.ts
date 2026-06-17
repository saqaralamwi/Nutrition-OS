import { create, StateCreator } from 'zustand';

export interface PatientState {
  patients: any[];
  totalCount: number;
  activeCount: number;
  isLoading: boolean;
  error: string | null;
  sortOrder: string;
  searchQuery: string;

  loadPatients: () => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  setSortOrder: (order: string) => Promise<void>;
  addPatient: (input: any) => Promise<{ success: boolean; patient?: any; errors?: any[] }>;
}

const storeCreator: StateCreator<PatientState> = (set, get) => ({
  patients: [],
  totalCount: 0,
  activeCount: 0,
  isLoading: false,
  error: null,
  sortOrder: 'newest',
  searchQuery: '',

  loadPatients: async () => {
    set({ isLoading: true, error: null });
    try {
      const { GetPatientsUseCase } = await import('../../domain/use-cases/GetPatientsUseCase');
      const useCase = new GetPatientsUseCase();
      const result = await useCase.execute();
      set({ patients: result, isLoading: false, totalCount: result.length, activeCount: result.filter((p: any) => p.status === 'active').length });
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

  addPatient: async (input: any) => {
    try {
      const { AddPatientUseCase } = await import('../../domain/use-cases/AddPatientUseCase');
      const { PatientRepository } = await import('../../data/repositories/PatientRepository');
      
      const repository = new PatientRepository();
      const useCase = new AddPatientUseCase(repository);
      
      const patient = await useCase.execute(input);
      
      // Update local state reactively
      const currentPatients = get().patients;
      set({ 
        patients: [patient, ...currentPatients],
        totalCount: get().totalCount + 1,
        activeCount: patient.status === 'active' ? get().activeCount + 1 : get().activeCount
      });
      
      return { success: true, patient };
    } catch (e: any) {
      if (e.type === 'VALIDATION_ERROR') {
        return { success: false, errors: e.errors };
      }
      return { 
        success: false, 
        errors: [{ field: 'general', message: e.message || 'حدث خطأ غير متوقع أثناء إضافة المريض' }] 
      };
    }
  },
});

export const usePatientStore = create<PatientState>(storeCreator);
