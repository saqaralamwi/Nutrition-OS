import { create, StateCreator } from 'zustand';
import { UserProfile, SubscriptionPlan, FULL_ACCESS_FEATURES } from '../../domain/entities/User';

export type HydrationState = 'idle' | 'hydrating' | 'hydrated' | 'error';

const GUEST_PROFILE: UserProfile = {
  id: 'guest',
  email: 'guest@app.local',
  fullName: 'ضيف',
  subscriptionPlan: 'clinic',
  patientLimit: FULL_ACCESS_FEATURES.patientLimit,
  aiEnabled: FULL_ACCESS_FEATURES.aiEnabled,
  createdAt: new Date().toISOString(),
};

export interface AuthState {
  user: UserProfile;
  isLoading: boolean;
  isAuthenticated: true;
  error: string | null;
  hydrationState: HydrationState;
  hydrationError: string | null;

  login: () => Promise<boolean>;
  register: () => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  updatePlan: (_plan: SubscriptionPlan) => void;
}

const storeCreator: StateCreator<AuthState> = (set) => ({
  user: GUEST_PROFILE,
  isLoading: false,
  isAuthenticated: true as const,
  error: null,
  hydrationState: 'hydrated',
  hydrationError: null,

  restoreSession: async () => {
    set({ hydrationState: 'hydrated' });
  },

  login: async () => {
    return true;
  },

  register: async () => {
    return true;
  },

  logout: async () => {
  },

  updatePlan: (_plan: SubscriptionPlan) => {
  },
});

export const useAuthStore = create<AuthState>(storeCreator);
