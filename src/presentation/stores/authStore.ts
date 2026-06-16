import { create, StateCreator } from 'zustand';
import { UserProfile, SubscriptionPlan, AuthCredentials, RegisterInput } from '../../domain/entities/User';
import * as authService from '../../data/cloud/auth';

export type HydrationState = 'idle' | 'hydrating' | 'hydrated' | 'error';

const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  email: 'guest@app.local',
  fullName: 'ضيف',
  subscriptionPlan: 'free',
  patientLimit: 20,
  aiEnabled: false,
  createdAt: new Date().toISOString(),
};

const isCloudConfigured =
  typeof process !== 'undefined' &&
  process.env?.EXPO_PUBLIC_SUPABASE_URL &&
  process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export interface AuthState {
  user: UserProfile | null;
  isCloudConfigured: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  hydrationState: HydrationState;
  hydrationError: string | null;

  login: (credentials: AuthCredentials) => Promise<boolean>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updatePlan: (plan: SubscriptionPlan) => void;
  clearError: () => void;
}

const storeCreator: StateCreator<AuthState> = (set, get) => ({
  user: null,
  isCloudConfigured: isCloudConfigured,
  isLoading: false,
  isAuthenticated: false,
  error: null,
  hydrationState: 'idle',
  hydrationError: null,

  restoreSession: async () => {
    set({ hydrationState: 'hydrating', hydrationError: null });

    if (!isCloudConfigured) {
      set({
        user: GUEST_PROFILE,
        isAuthenticated: true,
        hydrationState: 'hydrated',
      });
      return;
    }

    try {
      const { user, error } = await authService.getCurrentSession();
      if (user && !error) {
        set({
          user,
          isAuthenticated: true,
          hydrationState: 'hydrated',
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          hydrationState: 'hydrated',
        });
      }
    } catch (e: any) {
      set({
        hydrationState: 'error',
        hydrationError: e?.message || 'فشل استعادة الجلسة',
      });
    }
  },

  login: async (credentials: AuthCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const { user, error } = await authService.login(credentials);
      if (error) {
        set({ isLoading: false, error });
        return false;
      }
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return true;
    } catch (e: any) {
      set({
        isLoading: false,
        error: e?.message || 'حدث خطأ في تسجيل الدخول',
      });
      return false;
    }
  },

  register: async (input: RegisterInput) => {
    set({ isLoading: true, error: null });
    try {
      const { user, error } = await authService.register(input);
      if (error) {
        set({ isLoading: false, error });
        return false;
      }
      if (user) {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
      } else {
        set({
          isLoading: false,
          error: 'تم إنشاء الحساب. يرجى تفعيل البريد الإلكتروني.',
        });
      }
      return true;
    } catch (e: any) {
      set({
        isLoading: false,
        error: e?.message || 'حدث خطأ في إنشاء الحساب',
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch {
      // Proceed with local logout regardless
    }
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  updatePlan: (plan: SubscriptionPlan) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const limits: Record<SubscriptionPlan, { patientLimit: number; aiEnabled: boolean }> = {
      free: { patientLimit: 20, aiEnabled: false },
      pro: { patientLimit: Infinity, aiEnabled: true },
      clinic: { patientLimit: Infinity, aiEnabled: true },
    };

    const planFeatures = limits[plan] || limits.free;
    set({
      user: {
        ...currentUser,
        subscriptionPlan: plan,
        patientLimit: planFeatures.patientLimit,
        aiEnabled: planFeatures.aiEnabled,
      },
    });
  },

  clearError: () => set({ error: null }),
});

export const useAuthStore = create<AuthState>(storeCreator);
